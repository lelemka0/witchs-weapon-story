define([], () => {
    class audio {
        constructor() {
            this.audio = new Audio();
        }
        play(url) {
            if (typeof url === 'string')
                this.audio.src = url;
            else if(url instanceof Blob)
                this.audio.src = URL.createObjectURL(url);
            if (this.audio.src != ''){
                this.audio.play();
                return this;
            }
            console.log(this)
            throw ["failed to play"];
        }
        pause() {
            this.audio.pause();
            return this;
        }
        stop() {
            this.audio.pause();
            this.audio.currentTime = 0;
            return this;
        }
    };
    return audio;
});