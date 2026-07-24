#!/usr/bin/env python3
"""
赞助者数据更新脚本
运行方式: python update-sponsors.py
作用: 从爱发电 API 获取赞助者数据，生成 sponsors.json 供静态页面使用
"""

import json
import hashlib
import time
import urllib.request
import os

# ═══════════════════════════════════════════════
#  配置 — 从环境变量读取，也可直接修改此处
# ═══════════════════════════════════════════════
USER_ID = os.environ.get("AFDIAN_USER_ID", "d0764d485f3411edb88052540025c377")
TOKEN   = os.environ.get("AFDIAN_TOKEN",   "htHABCSbUkKWaEF3g4yN75mDjdsP9GvQ")
API_URL = "https://ifdian.net/api/open/query-sponsor"
OUTPUT  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "content", "sponsors.json")


def fetch_sponsors(page: int = 1) -> dict:
    """调用爱发电 query-sponsor API"""
    params = {"page": page}
    params_json = json.dumps(params, separators=(",", ":"))
    ts = int(time.time())

    # 签名: md5(token + "params" + json + "ts" + ts + "user_id" + user_id)
    raw = f"{TOKEN}params{params_json}ts{ts}user_id{USER_ID}"
    sign = hashlib.md5(raw.encode()).hexdigest()

    body = json.dumps({
        "user_id": USER_ID,
        "params": params_json,
        "ts": ts,
        "sign": sign,
    }, separators=(",", ":")).encode()

    req = urllib.request.Request(
        API_URL, data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def main():
    print("正在从爱发电获取赞助者数据...")
    try:
        result = fetch_sponsors(1)
    except Exception as e:
        print(f"获取失败: {e}")
        return 1

    if result.get("ec") != 200:
        print(f"API 返回错误: {result.get('em', 'unknown')}")
        return 1

    data = result.get("data", {})
    total_count = data.get("total_count", 0)
    print(f"共 {total_count} 条赞助记录")

    # 如果有多页，继续获取
    all_sponsors = list(data.get("list", []))
    total_page = data.get("total_page", 1)
    for p in range(2, total_page + 1):
        try:
            more = fetch_sponsors(p)
            if more.get("ec") == 200:
                all_sponsors.extend(more.get("data", {}).get("list", []))
        except Exception as e:
            print(f"第 {p} 页获取失败: {e}")

    # 按累计金额降序排列
    all_sponsors.sort(
        key=lambda x: float(x.get("all_sum_amount", 0) or 0),
        reverse=True,
    )

    # 写入文件
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump({
            "total_count": total_count,
            "list": all_sponsors,
            "updated_at": int(time.time()),
        }, f, ensure_ascii=False, indent=2)

    print(f"已写入 {OUTPUT}")
    return 0


if __name__ == "__main__":
    exit(main())
