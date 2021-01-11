let socket = io();
let userVideo = document.getElementById("user-video");
let peerVideo = $("#peer-video");
let creator = false;
let userStream;
let roomName;
let rtcPeerConnection;

let iceServers = {
    iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
    ],
};

$("#join").submit(function(e) {
    e.preventDefault();
    roomName = $("#roomName").val();
    if (roomName == "") { alert("please provide room name to join"); } else {
        socket.emit('join', roomName);
    }

});

socket.on('roomFull', function() {
    alert('Room is full, cannot join.');
});
socket.on('created', function() {
    console.log('Room is created');
    creator = true;

    navigator.mediaDevices.
    getUserMedia({ audio: false, video: { width: 1280, height: 720 } }).
    then(function(stream) {
            userStream = stream;

            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function(e) {
                userVideo.play();
            };
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function(e) {
                userVideo.play();
            };

            socket.emit('ready', roomName);

        })
        .catch(function() {

        });
});
socket.on('alreadyJoined', function() {
    alert('You cannot join room twice.');
});
socket.on('ready', function() {
    console.log('peer is ready to connect');

    if (creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        if (userStream.getTracks().length > 1) {

            rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        }
        rtcPeerConnection
            .createOffer()
            .then((offer) => {
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit("offer", offer, roomName);
            })

        .catch((error) => {
            console.log(error);
        });

    }


});


socket.on("candidate", function(candidate) {
    if (candidate == undefined) {
        console.log("candidate is undefined");
    }
    console.log(candidate);
    let icecandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(icecandidate);

});

socket.on("offer", function(offer) {
    console.log("offer received");
    if (!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        if (userStream.getTracks().length > 1) {
            rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        }
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection
            .createAnswer()
            .then((answer) => {
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit("answer", answer, roomName);
            })
            .catch((error) => {
                console.log(error);
            });
    }
});

socket.on("answer", function(answer) {
    console.log("answer");
    console.log(answer);
    rtcPeerConnection.setRemoteDescription(answer);
});


function OnIceCandidateFunction(event) {

    if (event.candidate) {

        socket.emit("candidate", event.candidate, roomName);
    }
}

function OnTrackFunction(event) {
    console.log("on OnTrackFunction");
    console.log(event);
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e) {
        peerVideo.play();
    };
}