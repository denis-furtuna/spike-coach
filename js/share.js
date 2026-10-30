/* A post-ready image of a result: Bo, the frozen moment, the coach's verdict, stats and streak. */
const ShareCard = (() => {
  "use strict";

  const W = 1080, H = 1350, PAD = 56;
  const INK = "#1F2A44", MUTED = "#6B7385";
  const TONES = {
    good: { ink: "#1D7A36", soft: "#E4F7E9" },
    fix: { ink: "#B4530A", soft: "#FFF1E3" },
  };
  const TILES = {          // band, value text, band text
    yellow: ["#FFC93C", "#B87F00", "#4A3200"],
    blue: ["#2B59E8", "#2B59E8", "#FFFFFF"],
    green: ["#2EA44F", "#1D7A36", "#FFFFFF"],
    orange: ["#F07A10", "#B4530A", "#FFFFFF"],
  };
  const FLAME = "M12 2c.6 3.2 2.6 4.9 4.3 6.8C18 10.7 19 12.6 19 15a7 7 0 0 1-14 0c0-2.3 1-4.2 2.6-5.6.2 1.6.9 2.8 2.1 3.4C9.4 9.4 10.2 5.3 12 2z";

  const font = (weight, size) => `${weight} ${size}px Nunito, system-ui, sans-serif`;

  function rounded(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrap(ctx, text, width) {
    const lines = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }

  const loadImage = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  // frame: a canvas with the frozen moment. tiles: [[label, value, tone]]. Resolves to a PNG blob.
  async function make({ frame, tone, title, text, tiles, streak, subtitle, tagline, link }) {
    if (document.fonts && document.fonts.load) {
      await Promise.all([document.fonts.load(font(900, 60)), document.fonts.load(font(800, 36))]).catch(() => {});
    }
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const c = TONES[tone] || TONES.good;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    // Header: Bo, name, drill, streak.
    const bo = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(Mascot.svg(tone === "good" ? "happy" : "normal"))}`);
    ctx.drawImage(bo, PAD - 6, 36, 144, 144);
    ctx.fillStyle = INK;
    ctx.font = font(900, 60);
    ctx.fillText("Spike Coach", 214, 110);
    ctx.fillStyle = MUTED;
    ctx.font = font(800, 36);
    ctx.fillText(subtitle, 216, 160);
    if (streak > 0) {
      ctx.font = font(900, 56);
      ctx.fillStyle = "#F07A10";
      ctx.textAlign = "right";
      ctx.fillText(String(streak), W - PAD, 128);
      const numW = ctx.measureText(String(streak)).width;
      ctx.textAlign = "left";
      ctx.save();
      ctx.translate(W - PAD - numW - 66, 70);
      ctx.scale(2.6, 2.6);
      ctx.fill(new Path2D(FLAME));
      ctx.restore();
    }

    // The frozen moment, letterboxed on dark.
    const fx = PAD, fy = 214, fw = W - 2 * PAD, fh = 600;
    ctx.save();
    rounded(ctx, fx, fy, fw, fh, 40);
    ctx.clip();
    ctx.fillStyle = "#0E1626";
    ctx.fillRect(fx, fy, fw, fh);
    if (frame && frame.width) {
      const s = Math.min(fw / frame.width, fh / frame.height);
      const dw = frame.width * s, dh = frame.height * s;
      ctx.drawImage(frame, fx + (fw - dw) / 2, fy + (fh - dh) / 2, dw, dh);
    }
    ctx.restore();

    // The verdict, on the tone's soft color.
    ctx.font = font(700, 38);
    const lines = wrap(ctx, text, fw - 72).slice(0, 3);
    const boxY = fy + fh + 32, boxH = 36 + 62 + 14 + lines.length * 50 + 26;
    ctx.fillStyle = c.soft;
    rounded(ctx, fx, boxY, fw, boxH, 32);
    ctx.fill();
    ctx.fillStyle = c.ink;
    ctx.font = font(900, 60);
    ctx.fillText(title, fx + 36, boxY + 36 + 50);
    ctx.font = font(700, 38);
    lines.forEach((line, k) => ctx.fillText(line, fx + 36, boxY + 36 + 62 + 14 + 38 + k * 50));

    // Stat tiles.
    const shown = tiles.slice(0, 3);
    if (shown.length) {
      const gap = 24, tw = (fw - gap * (shown.length - 1)) / shown.length, th = 150, ty = boxY + boxH + 32;
      shown.forEach(([label, value, toneName], k) => {
        const [band, valueInk, bandInk] = TILES[toneName] || TILES.blue;
        const tx = fx + k * (tw + gap);
        ctx.fillStyle = band;
        rounded(ctx, tx, ty, tw, th, 28);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        rounded(ctx, tx + 4, ty + 46, tw - 8, th - 50, 24);
        ctx.fill();
        ctx.textAlign = "center";
        ctx.fillStyle = bandInk;
        ctx.font = font(900, 26);
        ctx.fillText(label.toUpperCase(), tx + tw / 2, ty + 33);
        ctx.fillStyle = valueInk;
        ctx.font = font(900, 50);
        ctx.fillText(value, tx + tw / 2, ty + 118);
        ctx.textAlign = "left";
      });
    }

    // Footer.
    ctx.fillStyle = MUTED;
    ctx.font = font(800, 30);
    ctx.fillText(tagline, PAD, H - 48);
    if (link) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#2B59E8";
      ctx.fillText(link, W - PAD, H - 48);
      ctx.textAlign = "left";
    }

    return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  }

  // Opens the phone's share sheet with the image, or downloads it where sharing files isn't supported.
  async function share(blob, text) {
    const file = new File([blob], "spike-coach.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return "shared";
      } catch (err) {
        if (err && err.name === "AbortError") return "cancelled";
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spike-coach.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return "downloaded";
  }

  return { make, share };
})();
