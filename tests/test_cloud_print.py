"""Check the delivered printer models independently of the CAD environment."""
import json
from pathlib import Path
import struct
import unittest
import zipfile
from collections import Counter
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CLOUD = ROOT / 'design/cloud-radio/generated/cloud'
NS = '{http://schemas.microsoft.com/3dmanufacturing/core/2015/02}'


class CloudPrintTests(unittest.TestCase):
    def test_confirmed_full_button_assemblies_share_depth_with_side_controls_below_navigation(self):
        p = json.loads((CLOUD / 'parameters.json').read_text())
        buttons = [v for v in p['components'] if v['id'].startswith('button_')]
        self.assertEqual(len(buttons), 6)
        for button in buttons:
            axis = 0 if 'side' in button['id'] else 2
            self.assertGreaterEqual(button['size'][axis], 66)
            wire = next(v for v in p['keepouts'] if v['id'] == button['id'] + '_wires')
            self.assertGreaterEqual(wire['size'][axis], 12)
        fronts = [v for v in buttons if 'side' not in v['id']]
        sides = [v for v in buttons if 'side' in v['id']]
        navigation = [v for v in fronts if v['id'] in ('button_left', 'button_right')]
        self.assertTrue(all(s['origin'][1] + s['size'][1] < n['origin'][1]
                            for s in sides for n in navigation))
        self.assertEqual(p['case']['depth'], 86)
        self.assertEqual(p['case']['height_mm'], 215)
        self.assertEqual(p['case']['bed'], [220, 220])
        self.assertEqual(p['printer']['physical_bed_mm'], [235, 235])
        self.assertNotIn('handle', p)
        self.assertNotIn('battery_door', p)
        self.assertEqual(p['closure']['shell_screws'], 0)
        manifest = json.loads((CLOUD / 'manifest.json').read_text())
        self.assertEqual(manifest['print_parts'], ['front', 'rear'])
        for suffix in ('stl', '3mf'):
            self.assertFalse((CLOUD / f'battery_door.{suffix}').exists())
        items = {v['id']: v for v in p['components']}
        self.assertEqual(items['battery']['size'], [106, 14, 69])
        self.assertEqual(items['pi']['size'], [85, 1.6, 56])
        self.assertGreater(items['pi']['origin'][1], p['shelf']['battery_ceiling_y'])
        self.assertEqual(p['material'], 'PETG')

    def test_each_3mf_preserves_stl_scale_topology_and_print_orientation(self):
        for name in ('front', 'rear', 'button-fit-coupon'):
            with self.subTest(part=name), zipfile.ZipFile(CLOUD / f'{name}.3mf') as archive:
                model = ET.fromstring(archive.read('3D/3dmodel.model'))
                self.assertEqual(model.attrib['unit'], 'millimeter')
                vertices = [tuple(float(v.attrib[a]) for a in 'xyz') for v in model.findall(f'.//{NS}vertex')]
                faces = [tuple(int(v.attrib[a]) for a in ('v1', 'v2', 'v3')) for v in model.findall(f'.//{NS}triangle')]
                edges = Counter(tuple(sorted((a, b))) for f in faces for a, b in zip(f, f[1:] + f[:1]))
                self.assertEqual(set(edges.values()), {2}, '3MF must be closed and manifold')
                raw = (CLOUD / f'{name}.stl').read_bytes()
                count = struct.unpack_from('<I', raw, 80)[0]
                self.assertEqual(count, len(faces))
                stl = []
                for i in range(count):
                    values = struct.unpack_from('<12fH', raw, 84 + i * 50)
                    stl.extend(tuple(values[j:j + 3]) for j in (3, 6, 9))
                for axis in range(3):
                    span = lambda points: max(v[axis] for v in points) - min(v[axis] for v in points)
                    self.assertAlmostEqual(span(stl), span(vertices), places=4)
                self.assertAlmostEqual(min(v[2] for v in vertices), 0, places=5)
                for axis in (0, 1):
                    self.assertGreaterEqual(min(v[axis] for v in vertices), 2, 'Keep room for the brim')
                    self.assertLessEqual(max(v[axis] for v in vertices), 218, 'Brim must fit the 220 mm travel')

    def test_delivered_report_has_no_failed_geometry_or_mesh_checks(self):
        report = json.loads((CLOUD / 'verification.json').read_text())
        self.assertTrue(report['passed'])
        self.assertFalse([v for v in report['checks'] if not v['pass']])
        brep = [v for v in report['checks'] if 'BREP' in v['check']]
        self.assertEqual(len(brep), 3, 'Native CAD must pass solid and shell readback checks')
        self.assertTrue((CLOUD / 'cloud-radio.brep').is_file())
        self.assertFalse((CLOUD / 'cloud-radio.step').exists(), 'Do not publish the incomplete STEP export')
        for name, mesh in report['meshes'].items():
            with self.subTest(part=name):
                self.assertTrue(mesh['watertight'])
                self.assertTrue(mesh['consistent_winding'])
                self.assertGreater(mesh['volume_mm3'], 0)

    def test_v2_inside_and_xray_renders_use_the_same_cloud_revision(self):
        renders = json.loads((ROOT / 'docs/images/render-manifest.json').read_text())['renders']
        revision = json.loads((CLOUD / 'manifest.json').read_text())['revision']
        for name in ('assembled', 'exploded', 'rear', 'side', 'case_inside', 'roentgen'):
            self.assertEqual(renders[name]['scene'], 'cloud')
            self.assertEqual(renders[name]['revision'], revision)
            self.assertEqual(len([v for v in renders[name]['hardware'] if v.startswith('button_')]), 6)
        self.assertEqual(renders['case_inside']['visibleParts'], ['rear'])
        self.assertEqual(set(renders['roentgen']['visibleParts']), {'front', 'rear'})


if __name__ == '__main__':
    unittest.main()
