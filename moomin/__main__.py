import signal

from app.app import main, stop_signal

signal.signal(signal.SIGTERM, stop_signal)
raise SystemExit(main())
