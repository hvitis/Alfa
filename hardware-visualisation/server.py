"""FastAPI serves Three.js source modules and a live file-change stream."""
import asyncio
import hashlib
import json
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
app = FastAPI(title="Moomin hardware visualisation")


def source_revision(root=ROOT):
    files = [root / "index.html", root / "server.py"]
    files.extend(sorted((root / "src").rglob("*")))
    digest = hashlib.sha256()
    for path in files:
        if path.is_file():
            digest.update(str(path.relative_to(root)).encode())
            digest.update(path.read_bytes())
    return digest.hexdigest()[:20]


async def change_events(request, interval=0.35):
    previous = await asyncio.to_thread(source_revision)
    yield "event: ready\ndata: " + json.dumps({"revision": previous}) + "\n\n"
    ticks = 0
    while not await request.is_disconnected():
        await asyncio.sleep(interval)
        current = await asyncio.to_thread(source_revision)
        if current != previous:
            previous = current
            yield "event: change\ndata: " + json.dumps({"revision": current}) + "\n\n"
        ticks += 1
        if ticks % 30 == 0:
            yield ": heartbeat\n\n"


@app.middleware("http")
async def disable_cache(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/", response_class=HTMLResponse)
async def index():
    html = (ROOT / "index.html").read_text()
    return HTMLResponse(html.replace("</head>", "<script>window.MOOMIN_LIVE_RELOAD=true;</script></head>"))


@app.get("/api/health")
async def health():
    return {"status": "ok", "live_reload": True, "revision": await asyncio.to_thread(source_revision)}


@app.get("/api/events")
async def events(request: Request):
    return StreamingResponse(change_events(request), media_type="text/event-stream", headers={"X-Accel-Buffering": "no", "Cache-Control": "no-store"})


app.mount("/src", StaticFiles(directory=ROOT / "src"), name="source")
app.mount("/vendor/three", StaticFiles(directory=(ROOT / "node_modules" / "three").resolve(), check_dir=False), name="three")
app.mount("/output", StaticFiles(directory=PROJECT / "output"), name="diagrams")
app.mount("/reference", StaticFiles(directory=PROJECT / "photos"), name="reference")
app.mount("/design", StaticFiles(directory=PROJECT / "design"), name="design")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True, reload_dirs=[str(ROOT)], reload_excludes=["node_modules", ".venv", "dist"])
