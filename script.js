// Firebase setup (v8)
var firebaseConfig = {
  apiKey: "AIzaSyDLdnbGD6QnQmoQb1KkJuTZ04Acl2SSqWI",
  authDomain: "alviradib.firebaseapp.com",
  databaseURL: "https://alviradib-default-rtdb.firebaseio.com",
  projectId: "alviradib",
  storageBucket: "alviradib.appspot.com",
  messagingSenderId: "87203153607",
  appId: "1:87203153607:web:775a71e07d6d8525d360e2"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let player;
let room = "";
let isHost = false;

// YouTube IFrame API
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    events: { onStateChange: onPlayerStateChange },
  });
}

// Create room
function createRoom() {
  room = document.getElementById("roomInput").value.trim();
  if (!room) return alert("Enter a room code!");
  isHost = true;
  db.ref("rooms/" + room).set({
    video: "",
    action: "pause",
    time: 0,
  });
  document.getElementById("roomStatus").innerText = "Room: " + room + " (Host)";
  document.getElementById("syncStatus").innerText = "Room created successfully 💗";
  listenRoom();
}

// Join room
function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  if (!room) return alert("Enter a room code!");
  isHost = false;
  document.getElementById("roomStatus").innerText = "Room: " + room + " (Guest)";
  document.getElementById("syncStatus").innerText = "Joined successfully 💞";
  listenRoom();
}

// Load video
function loadVideo() {
  const url = document.getElementById("videoLink").value;
  const id = extractVideoID(url);
  if (!id) return alert("Invalid YouTube link!");
  player.loadVideoById(id);
  db.ref("rooms/" + room).update({ video: id, action: "pause", time: 0 });
}


// Extract YouTube ID
function extractVideoID(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Listen for room updates
function listenRoom() {
  db.ref("rooms/" + room).on("value", (snap) => {
    const data = snap.val();
    if (!data) return;

    // ✅ Load video if guest doesn't have it
    const currentId = player?.getVideoData()?.video_id;
    if (data.video && (!currentId || currentId !== data.video)) {
      player.loadVideoById(data.video);
    }

    // ✅ Sync play/pause for guests only
    if (!isHost) {
      if (data.action === "play") {
        player.playVideo();
        player.seekTo(data.time || 0, true);
      } else if (data.action === "pause") {
        player.pauseVideo();
        player.seekTo(data.time || 0, true);
      }
    }
  });
}


// Host sync actions
function onPlayerStateChange(event) {
  if (!isHost) return;
  const state = event.data;
  const time = player.getCurrentTime();

  if (state === YT.PlayerState.PLAYING) {
    db.ref("rooms/" + room).update({ action: "play", time });
  } else if (state === YT.PlayerState.PAUSED) {
    db.ref("rooms/" + room).update({ action: "pause", time });
  }
}

// Manual play/pause buttons
function playVideo() {
  if (!isHost) return alert("Only host can control playback!");
  player.playVideo();
  db.ref("rooms/" + room).update({ action: "play", time: player.getCurrentTime() });
}

function pauseVideo() {
  if (!isHost) return alert("Only host can control playback!");
  player.pauseVideo();
  db.ref("rooms/" + room).update({ action: "pause", time: player.getCurrentTime() });
}
