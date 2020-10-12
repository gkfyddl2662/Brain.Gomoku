const brain = require('brain.js');
const readline = require('readline');
const fs = require('fs');

const stream = fs.createReadStream(__dirname + '/PBeM.bdt');
const reader = readline.createInterface(stream, process.stdout);
const train_amount = 15;
const games = [];

const network = new brain.NeuralNetwork();

///Reading bdt file
reader.on('line', function (line) {
    const game = [];
    const str = line.split('[')[1].split(']')[0];
    const args = str.split(',');

    const moves = args[3].split('');
    game.move = [];
    let weird = false;
    for (let i = 0; i < moves.length; i += 2) {
        const move = [];
        move[0] = parseInt(moves[i], 16) - 1;
        move[1] = parseInt(moves[i + 1], 16) - 1;
        if (move[0] >= 0 && move[0] <= 15) {
            if (move[1] >= 0 && move[1] <= 15) {
                game.move.push(move);
            } else {
                weird = true;
            }
        } else {
            weird = true;
        }
    }
    game.winner = args[2] === "+" ? 0.5 : (args[2] === "-" ? 1 : 0);
    if (!weird && game.winner !== 0)
        games.push(game);
});

///Print Pretty input board
function prettyinput(board) {
    let a = "１２３４５６７８９ＡＢＣＤＥＦ";
    console.log("　" + a);
    for (let y = 0; y < 15; y++) {
        let str = a[14-y];
        for (let x = 0; x < 15; x++) {
            str += board[x][y] === black ? "○" : (board[x][y] === white ? "●" : "┼");
        }
        console.log(str);
    }
}

const dataset = [];
const white = 1;
const black = 0.5;

///Run game and Train
reader.on('close', function () {
    for (let i = 0; i < Math.min(games.length, train_amount); i++) {
        console.log('Train #' + (i + 1) + "/" + (Math.min(games.length, train_amount)));
        const game = games[i];
        const input = new Array(15).fill(0).map(() => new Array(15).fill(0));
        const moves = game.move;
        const winner = game.winner;
        let turn = black;
        for (let j = 0; j < moves.length; j++) {
            let output = new Array(15).fill(0).map(() => new Array(15).fill(0));
            const move = moves[j];
            input[move[0]][move[1]] = turn;
            output[move[0]][move[1]] = game.winner === turn ? 1 : 0.5;
            turn = turn === white ? black : white;
        }

        let newinput = [];
        for(let a = 0; a < input.length; a++)
        {
            newinput = newinput.concat(input[a]);
        }

        prettyinput(input);
        console.log(newinput)
        const data = [{
            input: newinput,
            output: {
                black: winner === black ? 1 : 0,
                white: winner === white ? 1 : 0
            }
        }];
        network.train(dataset.concat(data),{log: true, iterations:10});
    }
    fs.writeFile("results.json", JSON.stringify(network.toJSON()), function (err) {
        if (err) throw err;
        console.log('The "data to write" was appended to file!');
    });
    const output = network.run({
        0:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        1:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        2:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        3:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        4:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        5:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        6:  [0, 0, 0, 0, 0, 0, white, 0, white, 0, 0, 0, 0, 0, 0],
        7:  [0, 0, 0, 0, 0, 0, 0, black, 0, 0, 0, 0, 0, 0, 0],
        8:  [0, 0, 0, 0, 0, 0, 0, 0, black, black, 0, 0, 0, 0, 0],
        9:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        10: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        11: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        12: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        13: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        14: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    });
    console.log(output);
});