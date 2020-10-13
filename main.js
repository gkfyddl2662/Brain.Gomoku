const brain = require('brain.js');
const readline = require('readline');
const fs = require('fs');

const stream = fs.createReadStream(__dirname + '/PBeM.bdt');
const reader = readline.createInterface(stream, process.stdout);
const train_amount = 2000;
const games = [];

const network = new brain.NeuralNetwork();

const pretrained = false
const pretrained_model = 'results.json'

const dataset = [];
const white = 1;
const black = 0;

let inputsize = 0;
let outputsize = 0;
let longest_move=0;
let index = 0;
///Read bdt
if (!pretrained)
    reader.on('line', function (line) {
        const game = [];
        const str = line.split('[')[1].split(']')[0];
        const args = str.split(',');

        const moves = args[3].split('');
        game.move = [];
        game.winner = args[2] === "+" ? black : (args[2] === "-" ? white : -1);
        let weird = false;
        if(moves.length / 2 > longest_move) {
            longest_move = moves.length/2;
        }
        index++;
        const __move = []
        for (let i = 0; i < moves.length; i += 2) {
            const move = [];
            move[0] = parseInt(moves[i + 0], 16) - 1;
            move[1] = parseInt(moves[i + 1], 16) - 1;
            if (move[0] >= 0 && move[0] <= 15) {
                if (move[1] >= 0 && move[1] <= 15) {
                    __move.push(moves[i] + moves[i+1]);
                } else {
                    weird = true;
                }
            } else {
                weird = true;
            }
        }
        if (!weird && game.winner !== -1) {
            game.move = __move;
            games.push(game);
        }
    });
else
    network.fromJSON(JSON.parse(fs.readFileSync(pretrained_model, 'utf-8')));

///Print Pretty input board

function createEmptyBoard() {
    return new Array(15).fill(-1).map(() => new Array(15).fill(-1));
}

function prettyinput(board) {
    let a = "１２３４５６７８９ＡＢＣＤＥＦ";
    console.log("　" + a);
    for (let y = 0; y < 15; y++) {
        let str = a[14 - y];
        for (let x = 0; x < 15; x++) {
            str += board[x][y] === black ? "○" : (board[x][y] === white ? "●" : "┼");
        }
        console.log(str);
    }
}
function ConvertMove(string) {
    return string
        .trim()
        .split('')
        .map(integer);
}
///Run game and Train
reader.on('close', function () {
    console.log("Filtered "+ games.length + " games from " + index + " games");
    if(!pretrained) {
        for (let i = 0; i < Math.min(games.length, train_amount); i++) {
            const game = games[i];
            const input = new Array(225).fill('00');
            const moves = game.move;
            const winner = game.winner;
            let turn = black;
            for (let j = 0; j < moves.length; j++) {
                const move = moves[j];
                const output = JSON.parse(`{"${move}": ${winner === turn ? 1 : 0}}`)
                const data = {
                    input: input,
                    output: output
                }
                const clonedata = JSON.parse(JSON.stringify(data));
                input[j] = moves[j];
                dataset.push(clonedata);
                turn = turn === white ? black : white;
            }
            console.log('Setting Game #' + (i + 1) + " of " + (Math.min(games.length, train_amount)));
            console.log('Dataset Size : '+dataset.length);
        }
        network.train(dataset, {iterations: 3, log:true, logPeriod:3, errorThresh: 0.000000000005});
        fs.writeFile(pretrained_model, JSON.stringify(network.toJSON()), function (err) {
            if (err) throw err;
            console.log('The "data to write" was appended to file!');
        });
    }
    const input = new Array(225).fill('00');
    input[0] = '88';
    input[1] = '89';
    const output = network.run(input);
    let best = 0;
    let bestwhat = "0,0";
    for(let y=0;y<15;y++) {
        for(let x=0;x<15;x++) {
            if (output[(y*15) + x] > best) {
                best = output[(y*15) + x];
                bestwhat = `${x},${y}`;
            }
        }
    }
    console.log(bestwhat);
});