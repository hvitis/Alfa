import signal

from .app import main, stop_signal

signal.signal(signal.SIGTERM, stop_signal)
raise SystemExit(main())
