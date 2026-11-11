// Reduz a foto da câmera antes de guardar/enviar: ~1280 px e JPEG 70% (de 4 MB para ~200 KB).
export async function comprimirFoto(arq: File, lado = 1280, qualidade = 0.7): Promise<string> {
  const url = URL.createObjectURL(arq);
  try {
    const img = await new Promise<HTMLImageElement>((ok, falha) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => falha(new Error("Não foi possível ler a foto."));
      i.src = url;
    });
    const k = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", qualidade);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Pega a posição só agora, no registro (sem rastrear o técnico - RNF08). */
export function pegarGPS(tempoMs = 15000): Promise<{ lat: number; lon: number; precisao: number }> {
  return new Promise((ok, falha) => {
    if (!("geolocation" in navigator)) return falha(new Error("Este aparelho não tem GPS disponível."));
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lon: p.coords.longitude, precisao: Math.round(p.coords.accuracy) }),
      (e) => falha(new Error(e.code === 1 ? "Permissão de localização negada. O registro pode ser salvo sem GPS." : "Não foi possível obter o GPS agora.")),
      { enableHighAccuracy: true, timeout: tempoMs, maximumAge: 60000 });
  });
}
