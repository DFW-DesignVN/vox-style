#!/usr/bin/env python3
"""Small bridge for K07VN/capcut-tts-api.
Requires: pip install -e <path-to-capcut-tts-api> (or install its dependencies).
Prints one JSON object on stdout; Node downloads the returned speech_url locally.
"""
import argparse, json, sys
from capcut_tts_api import CapCutClient

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--text', required=True)
    p.add_argument('--voice', default='BV074_streaming')
    p.add_argument('--rate', default='1.0')
    a=p.parse_args()
    try:
        client=CapCutClient()
        result=client.generate_speech(texts=json.loads(a.text), voice=json.loads(a.voice), rate=a.rate, wait=True)
        tasks=((result.get('data') or {}).get('tasks') or [])
        if not tasks:
            raise RuntimeError('CapCut returned no completed task')
        task=tasks[0]
        payload=json.loads(task.get('payload') or '{}')
        audio=(payload.get('audio_subtitles') or [])
        speech_url=audio[0].get('speech_url') if audio else None
        if not speech_url:
            raise RuntimeError('CapCut success payload contains no speech_url')
        print(json.dumps({'status':'success','speech_url':speech_url,'voice':json.loads(a.voice)}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'status':'error','error':str(e)}, ensure_ascii=False))
        sys.exit(1)

if __name__=='__main__': main()
