var host = document.location.origin;
var socket = io.connect(host);
var music;
var pauseSwitch = true;
socket.on('connect', function (data) {
    socket.emit('screen');
});

socket.on('controlling', function (data) {
    var current = $(".selected");
    if (data.action === "goLeft") {

        $(".selected").removeClass("selected");

        if ($(current).prev().attr("id") === "start-block") {
            $("#end-block").prev().addClass("selected");
        } else {
            $(current).prev().addClass("selected");
        }

    }
    else if (data.action === "goRight") {

        $(".selected").removeClass("selected");

        if ($(current).next().attr("id") === "end-block") {
            $("#start-block").next().addClass("selected");
        } else {
            $(current).next().addClass("selected");
        }

    }
    else if (data.action === "tap") {
        socket.emit('modus', $(current).attr("id"));
    }
});

socket.on("audio", function (data) {

    if (data.action === "playAudio") {
        var id = data.audio_id;
        SC.initialize({
            client_id: '8d92ef7eb49ca0520b73de7ff8c7e348'
        });

        SC.stream("/tracks/" + id, function (sound) {
            music = sound;
            music.play();
        });
        jsonObj = {
            name: data.name,
            title: data.title
        };
        var template = $('#audioTpl').html(),
            html = Mustache.to_html(template, jsonObj);
        $('ul.video').append(html);
    }
    else if (data.action === "stop") {
        if (music != undefined) {
            music.stop();
            $(".music-block").remove();
        }
    }
    else if (data.action === "pause") {
        if (music != undefined) {
            if (pauseSwitch) {
                music.pause();
                pauseSwitch = false;
            }
            else {
                music.play();
                pauseSwitch = true;
            }
        }
    }
});