//计算rem
~ function() {
	function getREM() {
		var dw = 640;
		var winW = document.documentElement.clientWidth;
		//	document.documentElement.style.fontSize = winW/dw * 100 +"px";
		var htmlFont = 100;
		var $music = $("#music");
		window.htmlFont = htmlFont = document.documentElement.style.fontSize = winW / dw * 100;
		if(winW > dw) {
			$music.css({
				width: dw,
				margin: "0 auto"
			})
			return;
		}
		document.documentElement.style.fontSize = winW / dw * 100 + "px";
	}
	getREM();
	window.addEventListener("resize", function() {
		getREM();
		window.location.reload();
	}, false);
}();
/*计算main的高height*/
;
~ function() {
	var $main = $(".main"),
		$header = $(".header"),
		$footer = $(".footer");
	var winH = document.documentElement.clientHeight;
	$main.css("height", winH - $header[0].offsetHeight - $footer[0].offsetHeight - 0.8 * window.htmlFont);
}();
//controlRender 单例模式
var controlRender = (function() {
	var $musicAudio = $("#musicAudio"),
		musicAudio = $("#musicAudio")[0];

	var $musicBtn = $(".musicBtn"),
		$musicPlay = $(".musicBtn").eq(0),
		$musicPause = $(".musicBtn").eq(1),
		$lyric = $(".lyric");

	var $progress = $(".progress"),
		$current = $progress.find(".current"),
		$duration = $progress.find(".duration"),
		$timeLine = $progress.find(".timeLine"),
		$timeLineItem = $timeLine.find("span");

	var duration = 0;
	var $musicPlain = $.Callbacks();
	var timer = null;
	var step = 0;
	//十位不足补0
	function addZero(val) {
		return val < 10 ? "0" + val : val;
	}
	//控制自动播放 autoPlay
	function autoPlay() {
		musicAudio.play();
		//判断声音是否播放 canplay
		$musicAudio.on("canplay", function() {
			$musicPause.show();
			$musicPlay.hide();
			//计算声音总时间 单位 秒
			duration = musicAudio.duration;
			var m = Math.floor(duration / 60);
			var s = Math.floor(duration - m * 60);
			$duration.html(addZero(m) + ":" + addZero(s));
		});
	}
	$musicPlain.add(autoPlay);

	//控制播放和暂停
	function playPause() {
		//$musicBtn绑定单击事件
		$musicBtn.tap(function() {
			//判断musicAudio 如果是播放状态，就让它暂停，反之播放
			if(musicAudio.paused) {
				musicAudio.play();
				$musicPause.show();
				$musicPlay.hide();
				lyricSync();
			} else {
				musicAudio.pause();
				$musicPause.hide();
				$musicPlay.show();
				//				window.clearInterval(timer);
			}
		});
	}
	$musicPlain.add(playPause);

	//控制歌词和播放进度对应
	function lyricSync() {
		var $pList = $lyric.children("p");
		timer = window.setInterval(function() {
			//获取当前播放时间 
			var currentTime = musicAudio.currentTime;
			var m = addZero(Math.floor(currentTime / 60));
			var s = addZero(Math.floor(currentTime - m * 60));
			//显示当前播放时间
			$current.html(m + ":" + s);

			//播放完成 按钮重置
			if(musicAudio.ended) {
				window.clearInterval(timer);
				$musicPause.hide();
				$musicPlay.show();
				return;
			}

			$timeLineItem.css({
				transition: ".5s",
				width: currentTime / duration * 100 + "%"
			});
			//控制歌词对应
			$pList.each(function(index, item) {
				var pm = $(this).attr("m");
				var ps = $(this).attr("s");

				if(m == pm && s == ps) {
					var id = $(this).attr("id");
					step = /\d+/.exec(id);
					if(step >= 4) {
						$lyric.css("top", -(step - 3) * 0.84 + "rem");
					}
					$(this).addClass("bg").siblings().removeClass("bg");
				}

			});
		}, 300);
	}
	$musicPlain.add(lyricSync);
	//	$timeLine.on('touchstart', function(e) {
	//		var totalLength = $(this).offset().width
	//		var curLength = (e.changedTouches[0].clientX - $timeLine.offset().left) / $timeLine.offset().width;
	//		musicAudio.currentTime = curLength * duration;
	//		var $pList = $lyric.children("p");
	//		step = Math.floor($pList.length * curLength);
	//	});
	$timeLine.click(function(e) {
		var totalLength = $(this).offset().width
		var curLength = (e.pageX - $timeLine.offset().left) / $timeLine.offset().width;
		//		musicAudio.pause();
		//		musicAudio.src = musicAudio.src;
		musicAudio.currentTime = curLength * duration;
		//		musicAudio.play();
		var $pList = $lyric.children("p");
		step = Math.floor($pList.length * curLength);
		$timeLineItem.css({
			transition: ".5s",
			width: curLength * 100 + "%"
		});

	});
	//绑定歌词数据
	function bindHTML(dataAry) {
		var htmlStr = ``;
		$.each(dataAry, function(index, item) {
			htmlStr += `<p id="lyric_${item.id}" m="${item.m}" s="${item.s}">${item.c}</p>`;
		});
		$lyric.html(htmlStr);
		$musicPlain.fire();
	}
	return {
		init: function() {
			$.ajax({
				type: "get",
				url: "lyric.json",
				dataType: "json",
				success: function(data) {
					if(data) {
						data = data.lyric || "";
						data = data.replace(/&#(\d+);/g, function() {
							var num = Number(arguments[1]);
							var val = arguments[0];
							switch(num) {
								case 32:
									val = " ";
									break;
								case 40:
									val = "(";
									break;
								case 41:
									val = ")";
									break;
								case 45:
									val = "-";
									break;
							}
							return val;
						});
						var dataAry = [];
						var index = 0;
						var reg = /\[(\d+)&#58;(\d+)&#46;(?:\d+)\]([^&#]+)(&#10;)/g;
						data.replace(reg, function() {
							index++;
							var m = arguments[1];
							var s = arguments[2];
							var c = arguments[3];
							var obj = {
								id: index,
								m: m,
								s: s,
								c: c
							};
							dataAry.push(obj);
						});
						bindHTML(dataAry);
					}
				},
				error: function(e) {
					console.log(e.message)
				}
			});
		}
	}
})();
controlRender.init();