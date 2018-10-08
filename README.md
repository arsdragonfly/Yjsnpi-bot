# YJSNPI Bot

The stinkiest Discord bot ever. (realistically)

Check out the [Contribution Guidelines](./CONTRIBUTING.md) if you want you make Yjsnpi-bot become better!

## How to set up

Copy `config.example.ts` to `config.ts` and fill in a token obtained here:
<https://discordapp.com/developers/applications/me>

Then, install FFMpeg:
```bash
$ apt install ffmpeg
```

Then, install Annie for Bilibili access using 

```bash
$ go get github.com/iawia002/annie
```

or install Annie from here (remember to change config.ts accordingly): <https://github.com/iawia002/annie>

Next, clone the directory and run

```bash
$ npm install -g typescript
```

After installing typescript, run

```bash
$ npm install && npm run start
```

and you're ready to go.
