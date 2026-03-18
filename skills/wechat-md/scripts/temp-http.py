#!/usr/bin/env python3
import os
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    if len(sys.argv) < 2:
        print('Usage: temp-http.py <directory> [host] [port]', file=sys.stderr)
        sys.exit(1)

    directory = os.path.abspath(sys.argv[1])
    host = sys.argv[2] if len(sys.argv) > 2 else '127.0.0.1'
    port = int(sys.argv[3]) if len(sys.argv) > 3 else 0

    if not os.path.isdir(directory):
        print(f'Error: directory not found: {directory}', file=sys.stderr)
        sys.exit(1)

    os.chdir(directory)
    server = ThreadingHTTPServer((host, port), Handler)
    actual_host, actual_port = server.server_address
    print(f'SERVER_URL=http://{actual_host}:{actual_port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
