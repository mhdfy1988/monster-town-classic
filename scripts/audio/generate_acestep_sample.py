#!/usr/bin/env python3
"""使用本地 ACE-Step 1.5 生成可复现的项目音乐样片。

运行前设置 ``ACE_STEP_ROOT`` 为 ACE-Step 1.5 仓库的绝对路径，再使用该环境的
Python 执行本脚本。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


ACE_ROOT_VALUE = os.environ.get("ACE_STEP_ROOT")
if not ACE_ROOT_VALUE:
    raise RuntimeError("请先设置 ACE_STEP_ROOT，指向本地 ACE-Step 1.5 仓库")
ACE_ROOT = Path(ACE_ROOT_VALUE).resolve()
PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORK_DIR = PROJECT_ROOT / "assets" / "source" / "audio" / "acestep"
FINAL_DIR = PROJECT_ROOT / "public" / "assets" / "audio" / "music"

sys.path.insert(0, str(ACE_ROOT))

from acestep.handler import AceStepHandler  # noqa: E402
from acestep import model_downloader  # noqa: E402
from acestep.inference import (  # noqa: E402
    GenerationConfig,
    GenerationParams,
    generate_music,
)


SAMPLES = {
    "town": {
        "id": "greenbud-town-day-v1",
        "caption": (
            "instrumental bright pastoral pixel RPG town theme, playful woodwind melody, "
            "warm marimba and soft pizzicato strings, subtle chiptune pulse, welcoming and "
            "curious, compact handheld game arrangement, clean loop-friendly ending, "
            "no vocals, no choir, no cinematic trailer drums"
        ),
        "bpm": 104,
        "keyscale": "G Major",
        "timesignature": "4/4",
        "duration": 24,
        "seed": 241001,
    },
    "battle": {
        "id": "wild-battle-v1",
        "caption": (
            "instrumental energetic turn-based monster battle theme for a colorful pixel RPG, "
            "urgent syncopated lead melody, punchy retro synth bass, tight snare and tom rhythm, "
            "short brass accents, adventurous rather than frightening, compact handheld game "
            "arrangement, strong repeating motif, clean loop-friendly ending, no vocals, "
            "no choir, no cinematic trailer booms"
        ),
        "bpm": 148,
        "keyscale": "E Minor",
        "timesignature": "4/4",
        "duration": 24,
        "seed": 241002,
    },
}


def encode_runtime_audio(source_path: Path, final_path: Path) -> None:
    """将无损母版编码为浏览器运行时使用的 Ogg Vorbis。"""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise FileNotFoundError("未找到 ffmpeg，无法生成浏览器用 OGG")
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(source_path),
            "-c:a",
            "libvorbis",
            "-q:a",
            "5",
            str(final_path),
        ],
        check=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="生成项目音乐样片")
    parser.add_argument("sample", choices=sorted(SAMPLES), nargs="?", default="town")
    parser.add_argument(
        "--encode-existing",
        action="store_true",
        help="不重新推理，使用生成记录中的 WAV 母版刷新运行时 OGG",
    )
    args = parser.parse_args()
    sample = SAMPLES[args.sample]

    if not ACE_ROOT.is_dir():
        raise FileNotFoundError(f"ACE-Step 目录不存在：{ACE_ROOT}")

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    FINAL_DIR.mkdir(parents=True, exist_ok=True)

    metadata_path = WORK_DIR / f"{sample['id']}.json"
    final_path = FINAL_DIR / f"{sample['id']}.ogg"
    if args.encode_existing:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        generated_path = PROJECT_ROOT / metadata["source_file"]
        encode_runtime_audio(generated_path, final_path)
        metadata["output_file"] = str(final_path.relative_to(PROJECT_ROOT))
        metadata["output_sha256"] = hashlib.sha256(final_path.read_bytes()).hexdigest()
        metadata["runtime_codec"] = "Ogg Vorbis q5"
        metadata_path.write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"编码完成：{final_path}")
        print(f"生成记录：{metadata_path}")
        return 0

    # 本项目使用 thinking=False 的纯 DiT 推理，不需要 1.7B 语言模型。
    # ACE-Step 1.5 当前仍把该可选模型计入“主模型完整性”检查，
    # 因而在每次启动时会误触发约 3.5 GB 下载；这里仅收窄本进程的必需组件。
    model_downloader.MAIN_MODEL_COMPONENTS = [
        "acestep-v15-turbo",
        "vae",
        "Qwen3-Embedding-0.6B",
    ]

    handler = AceStepHandler()
    status, success = handler.initialize_service(
        project_root=str(ACE_ROOT),
        config_path="acestep-v15-turbo",
        device="cuda",
        compile_model=False,
        offload_to_cpu=True,
        offload_dit_to_cpu=True,
        quantization="int8_weight_only",
        # 匿名使用 ModelScope，避免读取失效的 Hugging Face 登录状态。
        prefer_source="modelscope",
        use_mlx_dit=False,
    )
    print(status)
    if not success:
        return 1

    params = GenerationParams(
        task_type="text2music",
        thinking=False,
        caption=sample["caption"],
        lyrics="[Instrumental]",
        instrumental=True,
        vocal_language="unknown",
        bpm=sample["bpm"],
        keyscale=sample["keyscale"],
        timesignature=sample["timesignature"],
        duration=sample["duration"],
        inference_steps=8,
        guidance_scale=1.0,
        seed=sample["seed"],
        use_cot_metas=False,
        use_cot_caption=False,
        use_cot_lyrics=False,
        use_cot_language=False,
    )
    config = GenerationConfig(
        batch_size=1,
        use_random_seed=False,
        seeds=[sample["seed"]],
        audio_format="wav",
    )

    result = generate_music(
        handler,
        None,
        params=params,
        config=config,
        save_dir=str(WORK_DIR),
    )
    if not result.success or not result.audios:
        print(result.error or result.status_message, file=sys.stderr)
        return 2

    generated_path = Path(result.audios[0]["path"])
    encode_runtime_audio(generated_path, final_path)
    output_sha256 = hashlib.sha256(final_path.read_bytes()).hexdigest()

    metadata = {
        **sample,
        "generator": "ACE-Step 1.5",
        "model": "acestep-v15-turbo",
        "thinking": False,
        "inference_steps": 8,
        "source_file": str(generated_path.relative_to(PROJECT_ROOT)),
        "output_file": str(final_path.relative_to(PROJECT_ROOT)),
        "output_sha256": output_sha256,
        "runtime_codec": "Ogg Vorbis q5",
    }
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"生成完成：{final_path}")
    print(f"生成记录：{metadata_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
