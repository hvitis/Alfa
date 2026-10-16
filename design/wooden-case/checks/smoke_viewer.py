"""Exercise the standalone HTML via file:// with all network requests blocked."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
errors=[];requests=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.route('http://**/*',lambda route:(requests.append(route.request.url),route.abort()))
    page.route('https://**/*',lambda route:(requests.append(route.request.url),route.abort()))
    page.goto((ROOT/'viewer.html').as_uri())
    page.wait_for_function("window.__CASE_READY__ === 'internals'",timeout=45000)
    page.locator('[data-camera="rear"]').click()
    page.locator('#labels').check()
    page.locator('#labels').uncheck()
    page.screenshot(path=str(ROOT/'previews/viewer_inside.png'))
    page.locator('#wire').select_option('S3')
    assert 'P12' in page.locator('#detail').inner_text()
    page.locator('#group').select_option('Audio')
    page.locator('#wood').uncheck()
    page.locator('[data-mode="exploded"]').click()
    page.wait_for_function("window.__CASE_READY__ === 'exploded'")
    page.locator('[data-mode="enclosure"]').click()
    page.wait_for_function("window.__CASE_READY__ === 'enclosure'")
    page.locator('#wood').check()
    page.locator('#group').select_option('None')
    page.locator('[data-camera="front"]').click()
    page.screenshot(path=str(ROOT/'previews/viewer_front.png'))
    browser.close()
assert not errors, errors
assert not requests, requests
result={'pass':True,'tested':['file:// offline load; blocked external network','all three saved CAD models','rear/front camera presets','wood and labels toggles','wire S3 selection with physical pin P12','Audio/None filters'],'console_errors':errors,'external_requests':requests}
(ROOT/'viewer-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print('Offline viewer passed: 3 models, filters, camera and wire selection; no external requests.')
