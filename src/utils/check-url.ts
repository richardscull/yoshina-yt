export async function GetValidImage(images: any) {
  for (let i = images.length - 1; i >= 0; i--) {
    const isAvaliable = await CheckIfAvaliable(images[i].url);
    if (isAvaliable) return images[i].url;
  }
  return "https://i.imgur.com/WO45goR.png";
}

export async function CheckIfAvaliable(url: string) {
  try {
    const check = await fetch(url);
    return check;
  } catch (error) {
    return;
  }
}
