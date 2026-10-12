import asyncio
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import server


class ServerTests(unittest.IsolatedAsyncioTestCase):
    async def test_page_modules_health_and_cache_headers(self):
        transport = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            page = await client.get("/")
            self.assertEqual(page.status_code, 200)
            self.assertIn("window.MOOMIN_LIVE_RELOAD=true", page.text)
            self.assertIn('type="importmap"', page.text)
            self.assertIn('id="view-case"', page.text)
            self.assertEqual(page.headers["cache-control"], "no-store")
            for url in [
                "/src/main.js",
                "/src/styles.css",
                "/src/data/setup.json",
                "/src/scene/caseScene.js",
                "/src/data/case-routing.json",
                "/src/data/case-glb/internals.glb",
                "/design/wooden-case/PDF/a4_cutting_and_drilling.pdf",
                "/vendor/three/build/three.module.js",
            ]:
                response = await client.get(url)
                self.assertEqual(response.status_code, 200, url)
            health = (await client.get("/api/health")).json()
            self.assertTrue(health["live_reload"])
            self.assertEqual(health["revision"], server.source_revision())


    async def test_change_stream_sends_ready_and_actual_changes(self):
        class Request:
            async def is_disconnected(self):
                return False
        with patch.object(server, "source_revision", side_effect=["before", "after"]):
            events = server.change_events(Request(), interval=0)
            ready = await anext(events)
            self.assertIn("event: ready", ready)
            change = await anext(events)
            self.assertIn("event: change", change)
            self.assertIn("after", change)
            await events.aclose()

    def test_revision_detects_content_edits_additions_and_deletions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "src").mkdir()
            (root / "index.html").write_text("index")
            (root / "server.py").write_text("server")
            source = root / "src" / "view.js"
            source.write_text("first")
            first = server.source_revision(root)
            source.write_text("changed")
            second = server.source_revision(root)
            self.assertNotEqual(first, second)
            added = root / "src" / "extra.js"
            added.write_text("extra")
            self.assertNotEqual(second, server.source_revision(root))
            added.unlink()
            self.assertEqual(second, server.source_revision(root))


if __name__ == "__main__":
    unittest.main()
