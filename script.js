// Photo Collage Builder JavaScript

let photos = [];
let collageGenerated = false;

document.getElementById("fileInput").addEventListener("change", function (e) {
  const files = Array.from(e.target.files);
  loadPhotos(files);
  this.value = "";
});

function loadPhotos(files) {
  let loaded = 0;
  const totalFiles = files.length;
  if (totalFiles === 0) return;
  document.getElementById("loading").classList.add("active");
  document.getElementById(
    "loading"
  ).textContent = `Loading photos: 0/${totalFiles}`;
  const batchSize = 5;
  let currentBatch = 0;
  function processBatch() {
    const start = currentBatch * batchSize;
    const end = Math.min(start + batchSize, totalFiles);
    for (let i = start; i < end; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        loaded++;
        continue;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          const maxDimension = 1800;
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            photos.push({
              src: canvas.toDataURL("image/jpeg", 0.85),
              width: width,
              height: height,
              aspectRatio: width / height,
            });
          } else {
            photos.push({
              src: e.target.result,
              width: img.width,
              height: img.height,
              aspectRatio: img.width / img.height,
            });
          }
          loaded++;
          document.getElementById(
            "loading"
          ).textContent = `Loading photos: ${loaded}/${totalFiles}`;
          updatePhotoCount();
          if (loaded === totalFiles) {
            document.getElementById("loading").classList.remove("active");
            console.log(`Batch complete. Total photos: ${photos.length}`);
          }
        };
        img.onerror = function () {
          loaded++;
          if (loaded === totalFiles) {
            document.getElementById("loading").classList.remove("active");
          }
        };
        img.src = e.target.result;
      };
      reader.onerror = function () {
        loaded++;
        if (loaded === totalFiles) {
          document.getElementById("loading").classList.remove("active");
        }
      };
      reader.readAsDataURL(file);
    }
    currentBatch++;
    if (end < totalFiles) {
      setTimeout(processBatch, 50);
    }
  }
  processBatch();
}

function updatePhotoCount() {
  document.getElementById("photoCount").textContent = `${photos.length} photo${
    photos.length !== 1 ? "s" : ""
  } uploaded`;
}

function generateCollage() {
  if (photos.length === 0) {
    alert("Please upload some photos first!");
    return;
  }
  document.getElementById("loading").classList.add("active");
  document.getElementById("loading").textContent = "Calculating positions...";
  setTimeout(() => {
    const canvasWidth = parseInt(document.getElementById("canvasWidth").value);
    const canvasHeight = parseInt(
      document.getElementById("canvasHeight").value
    );
    const photoSize = parseInt(document.getElementById("photoSize").value);
    const collage = document.getElementById("collage");
    collage.style.width = canvasWidth + "px";
    collage.style.height = canvasHeight + "px";
    collage.innerHTML = "";
    const positions = placePhotos(canvasWidth, canvasHeight, photoSize);
    let maxZIndex = positions.length;
    document.getElementById(
      "loading"
    ).textContent = `Placing ${positions.length} photos...`;
    const batchSize = 20;
    let currentIndex = 0;
    function renderBatch() {
      const end = Math.min(currentIndex + batchSize, positions.length);
      for (let i = currentIndex; i < end; i++) {
        const pos = positions[i];
        const photoDiv = document.createElement("div");
        photoDiv.className = "photo";
        photoDiv.style.left = pos.x + "px";
        photoDiv.style.top = pos.y + "px";
        photoDiv.style.width = pos.width + "px";
        photoDiv.style.height = pos.height + "px";
        photoDiv.style.transform = `rotate(${pos.rotation}deg)`;
        photoDiv.style.zIndex = pos.zIndex;
        const img = document.createElement("img");
        img.src = pos.photo.src;
        photoDiv.appendChild(img);
        photoDiv.addEventListener("click", function () {
          maxZIndex++;
          this.style.zIndex = maxZIndex;
        });
        collage.appendChild(photoDiv);
      }
      currentIndex = end;
      if (currentIndex < positions.length) {
        document.getElementById(
          "loading"
        ).textContent = `Placing photos: ${currentIndex}/${positions.length}`;
        requestAnimationFrame(renderBatch);
      } else {
        collageGenerated = true;
        document.getElementById("loading").classList.remove("active");
        console.log("Collage generation complete!");
      }
    }
    renderBatch();
  }, 100);
}

function placePhotos(canvasWidth, canvasHeight, baseSize) {
  const positions = [];
  const shuffled = [...photos].sort(() => Math.random() - 0.5);
  const overlapFactor = 0.55;
  const effectivePhotoSize = baseSize * overlapFactor;
  const cols = Math.ceil(canvasWidth / effectivePhotoSize) + 2;
  const rows = Math.ceil(canvasHeight / effectivePhotoSize) + 2;
  const totalNeeded = cols * rows;
  let photosToUse = [];
  let duplicatesUsed = 0;
  while (photosToUse.length < totalNeeded) {
    const remaining = totalNeeded - photosToUse.length;
    const batch = [...shuffled]
      .sort(() => Math.random() - 0.5)
      .slice(0, remaining);
    photosToUse.push(...batch);
    if (photosToUse.length < totalNeeded) {
      duplicatesUsed += batch.length;
    }
  }
  photosToUse = photosToUse.sort(() => Math.random() - 0.5);
  let photoIndex = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (photoIndex >= photosToUse.length) break;
      const photo = photosToUse[photoIndex];
      photoIndex++;
      const sizeVariation = 0.9 + Math.random() * 0.4;
      let width, height;
      if (photo.aspectRatio > 1) {
        width = baseSize * sizeVariation;
        height = width / photo.aspectRatio;
      } else {
        height = baseSize * sizeVariation * 1.1;
        width = height * photo.aspectRatio;
      }
      const xBase = col * effectivePhotoSize - baseSize * 0.2;
      const yBase = row * effectivePhotoSize - baseSize * 0.2;
      const offsetRange = baseSize * 0.4;
      const xOffset = (Math.random() - 0.5) * offsetRange;
      const yOffset = (Math.random() - 0.5) * offsetRange;
      const x = xBase + xOffset;
      const y = yBase + yOffset;
      const rotation = (Math.random() - 0.5) * 20;
      const zIndex = Math.floor(Math.random() * totalNeeded);
      positions.push({
        photo,
        x: x,
        y: y,
        width,
        height,
        rotation,
        zIndex,
      });
    }
  }
  return positions;
}

async function downloadCollage() {
  if (!collageGenerated) {
    alert("Please generate a collage first!");
    return;
  }
  const collage = document.getElementById("collage");
  const canvasWidth = parseInt(collage.style.width);
  const canvasHeight = parseInt(collage.style.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f9f9f9";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  const photoElements = Array.from(collage.querySelectorAll(".photo"));
  photoElements.sort((a, b) => {
    return parseInt(a.style.zIndex) - parseInt(b.style.zIndex);
  });
  for (const photoEl of photoElements) {
    const img = photoEl.querySelector("img");
    const x = parseFloat(photoEl.style.left);
    const y = parseFloat(photoEl.style.top);
    const width = parseFloat(photoEl.style.width);
    const height = parseFloat(photoEl.style.height);
    const rotationMatch = photoEl.style.transform.match(/-?\d+\.?\d*/);
    const rotation = rotationMatch
      ? (parseFloat(rotationMatch[0]) * Math.PI) / 180
      : 0;
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rotation);
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(-width / 2 + radius, -height / 2);
    ctx.lineTo(width / 2 - radius, -height / 2);
    ctx.quadraticCurveTo(
      width / 2,
      -height / 2,
      width / 2,
      -height / 2 + radius
    );
    ctx.lineTo(width / 2, height / 2 - radius);
    ctx.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
    ctx.lineTo(-width / 2 + radius, height / 2);
    ctx.quadraticCurveTo(
      -width / 2,
      height / 2,
      -width / 2,
      height / 2 - radius
    );
    ctx.lineTo(-width / 2, -height / 2 + radius);
    ctx.quadraticCurveTo(
      -width / 2,
      -height / 2,
      -width / 2 + radius,
      -height / 2
    );
    ctx.closePath();
    ctx.clip();
    await new Promise((resolve) => {
      if (img.complete) {
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        resolve();
      } else {
        img.onload = function () {
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          resolve();
        };
      }
    });
    ctx.restore();
  }
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "photo-collage-" + Date.now() + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  }, "image/png");
}

function clearAll() {
  if (confirm("Clear all photos and start over?")) {
    photos = [];
    collageGenerated = false;
    document.getElementById("collage").innerHTML = "";
    updatePhotoCount();
  }
}
