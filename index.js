const express = require('express')
const yargs = require('yargs');
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')

const args = yargs
    .command("* <device>", "example: /dev/tty.usbmodem1101")
    .options({
        baudRate: {
            alias: 'b',
            type: 'string',
            description: 'baud rate',
            default: 115200
        },
        httpPort: {
            alias: 'p',
            type: 'string',
            description: 'http port',
            default: 80
        },
        verbose: {
            alias: 'v',
            type: 'boolean',
            description: 'Run with verbose logging'
        }
    })
    .parseSync()

const port = new SerialPort({ path: args.device, baudRate: args.baudRate })
const parser = port.pipe(new ReadlineParser());

let co2 = -1;
let updated = Date.now();

const log = (...args) => {
    args.verbose && console.log(...args);
}

port.write('STA', (err) => {
    if (err) {
        return log('Error on write: ', err.message)
    }
    log('message written')
})

parser.on('data', (data) => {
    try {
        co2 = Number((data.match(/CO2=(\d+),/) || [])[1] || -1);
        updated = Date.now();
    } catch (e) {
       console.error(e)
    }
})

const app = express()
app.listen(args.httpPort, () => {
    log(`Server is running on port ${args.httpPort}`);
});

app.get('/', (req, res)=> {
    res.json({ co2, updated });
    res.end();
})