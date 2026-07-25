#!/usr/bin/env python3
"""
Live-reload 静态文件开发服务器。
监听文件变更，自动刷新浏览器。
"""

import os
import io
import json
import time
import socketserver
from http import server
from urllib.parse import urlparse

PORT = 8080
WATCH_DIR = os.getcwd()

# 注入到 HTML 的脚本 —— 每秒轮询检查文件变更
LIVERELOAD_SCRIPT = b'<script>\n' \
    b'(function(){var t=Date.now();\n' \
    b'setInterval(function(){var x=new XMLHttpRequest();\n' \
    b"x.open('GET','/__check?t='+Date.now(),true);\n" \
    b'x.onload=function(){var d=JSON.parse(x.responseText);\n' \
    b"if(d.mtime>t){t=d.mtime;location.reload()}};\n" \
    b'x.send()},1000)})();\n' \
    b'</script>\n</head>'

INJECT_TARGET = b'</head>'


def get_latest_mtime():
    """扫描目录下所有文件，返回最新的修改时间戳。"""
    latest = 0
    for root, dirs, files in os.walk(WATCH_DIR):
        # 跳过隐藏目录和缓存目录
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
        for fname in files:
            fpath = os.path.join(root, fname)
            try:
                mtime = os.path.getmtime(fpath)
                if mtime > latest:
                    latest = mtime
            except OSError:
                pass
    return latest


class LiveReloadHandler(server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        # 文件变更检查端点
        if parsed.path == '/__check':
            mtime = get_latest_mtime()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(json.dumps({'mtime': mtime}).encode())
            return

        path = self.translate_path(self.path)

        # HTML 文件注入 live-reload 脚本
        if os.path.isfile(path) and (path.endswith('.html') or path.endswith('.htm')):
            try:
                with open(path, 'rb') as f:
                    data = f.read()
                if INJECT_TARGET in data:
                    data = data.replace(INJECT_TARGET, LIVERELOAD_SCRIPT, 1)
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(data)))
                self.send_header('Last-Modified', self.date_time_string(os.path.getmtime(path)))
                self.end_headers()
                self.wfile.write(data)
                return
            except Exception:
                pass

        # 其他文件走默认处理
        super().do_GET()


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        PORT = int(sys.argv[1])
    if len(sys.argv) > 2:
        WATCH_DIR = os.path.abspath(sys.argv[2])

    os.chdir(WATCH_DIR)

    print(f"🌟 Live-reload server running at http://localhost:{PORT}")
    print(f"📁 Watching: {WATCH_DIR}")
    print("💡 Press Ctrl+C to stop")

    with socketserver.TCPServer(('', PORT), LiveReloadHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n👋 Server stopped.')
            httpd.shutdown()
