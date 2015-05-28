var host = document.location.origin;
var socket = io.connect(host);
var apiKey = "AIzaSyB-fQwk4mjOAjvqfOC9olzMXQ-Ji5Dz9vo";
var remoteType;
socket.on('connect', function (data) {
    socket.emit('remote');

    //Youtube
    var Youtube = {
        getVideo: function (query, socket) {
            var max_videos = 12;
            var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&order=viewCount&q=" + escape(query) + "&type=video&key=" + apiKey;
            var idsMetDuration = new Array();

            $.getJSON(url, function (datavid) {
                var ids = new Array();
                $(datavid.items).each(function (key, item) {
                    ids.push(item.id.videoId);
                });
                var durationUrl = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" + escape(ids.toString()) + "&key=" + apiKey;
                $.getJSON(durationUrl, function (data) {
                    $(data.items).each(function (key, item) {
                        var duration = item.contentDetails.duration.match(/(\d+)/g);
                        var hours, minutes, seconds;
                        if (duration.length === 3) {
                            hours = duration[0];
                            minutes = duration[1];
                            seconds = duration[2];
                        } else {
                            hours = 0;
                            minutes = duration[0];
                            seconds = duration[1];

                        }

                        var durationString = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
                        idsMetDuration.push({
                            id: item.id,
                            duration: durationString
                        })
                    });

                    $("ul.video").html("");
                    var jsonObj = [];
                    $(datavid.items).each(function (key, video) {

                        id = video.id.videoId,
                            title = video.snippet.title,
                            thumbnail = video.snippet.thumbnails.default.url,
                            duration = ($.grep(idsMetDuration, function (e) {
                                return e.id == id;
                            }))[0].duration;

                        jsonObj = {
                            id: id,
                            title: title,
                            thumbnail: thumbnail,
                            duration: duration
                        };


                        var template = $('#videoTpl').html(),
                            html = Mustache.to_html(template, jsonObj);
                        $('ul.video').append(html);

                    });
                    $(".watch").on("click", function () {
                        var video_id = $(this).data('id');
                        socket.emit('video', {action: "play", video_id: video_id});
                        // });
                        // });

                    });


                });

            });
        }
    };

    var Soundcloud = {
        getMusic: function (query, socket) {
            var max_music = 12;
            var id = "8d92ef7eb49ca0520b73de7ff8c7e348";

            SC.initialize({
                client_id: id
            });
            SC.get('/tracks', {q: query, limit: max_music}, function (tracks) {

                console.log(tracks);
                $(tracks).each(function (key, track) {
                    totalSec = track.duration;
                    hours = parseInt(totalSec / 3600) % 24;
                    minutes = parseInt(totalSec / 60) % 60;
                    seconds = totalSec % 60;

                    var duration = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);


                    jsonObj = {
                        id: track.id,
                        name: track.user.username,
                        title: track.title,
                        duration: duration
                    };


                    var template = $('#audioTpl').html(),
                        html = Mustache.to_html(template, jsonObj);
                    $('ul.video').append(html);
                });
                $(".watch").on("click", function () {
                    var audio_id = $(this).data('id');
                    var audio_name = $("#name").text();
                    var audio_title = $("#title").text();
                    socket.emit('audio', {
                        action: "playAudio",
                        audio_id: audio_id,
                        name: audio_name,
                        title: audio_title
                    });

                });
            });


        }
    };

    $$(".r-container").swipeLeft(function () {
        socket.emit('controll', {action: "swipeLeft"});
    });

    $$(".r-container").swipeRight(function () {
        socket.emit('controll', {action: "swipeRight"});
    });
    $$(".r-header").tap(function () {
        socket.emit('controll', {action: "tap"});
        $(".app-body").fadeToggle("fast", function () {
        });
        if (remoteType === "listen") {
            socket.emit("audio", {action: "stop"});
        }
        else if (remoteType === "watch") {
            $.get(host + '/omx/quit', function (data) {
                console.log(data);
            });
        }

    });
    $$(".app-body").tap(function (e) {
        var i = $.inArray("watch", e.path[0].classList);
        if (remoteType === "listen" && i === -1) {
            socket.emit("audio", {action: "pause"});
        }
        else if (remoteType === "watch") {
            $.get(host + '/omx/pause', function (data) {
                console.log(data);
            });
        }
        else {
            socket.emit("controll", {action: "tap"});
        }

    });
    $(".search input").change(function () {
        if (remoteType === "listen") {
            Soundcloud.getMusic($(this).val(), socket);
        }
        else if (remoteType === "watch") {
            Youtube.getVideo($(this).val(), socket);
        }
    });

    socket.on("loading", function (data) {
        console.log(data);
    });
    socket.on("modus", function (data) {
        remoteType = data;
    });
});