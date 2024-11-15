const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const portNumber = 5000;
process.stdin.setEncoding("utf8");

class DataInput {
    #itemsList;

    constructor(itemsList) {
        this.#itemsList = itemsList;
    }

    get itemsList() {
        return this.#itemsList;
    }
}

if (process.argv.length != 3) {
    process.stdout.write(`Usage supermarketServer.js jsonFile\n`);
    process.exit(1);
}

console.log(`Web server is running at http://localhost:${portNumber}`);
const prompt = "Type itemsList or stop to shutdown the server: ";
process.stdout.write(prompt);

const fileContent = fs.readFileSync(process.argv[2], 'utf-8');
let jsonData = JSON.parse(fileContent);

const data = new DataInput(jsonData.itemsList);

process.stdin.on('readable', () => { 
	const dataInput = process.stdin.read();
	if (dataInput !== null) {
		const command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0);
        } else if (command === "itemsList") {
            console.log("[");
            data.itemsList.forEach((e, index) => {
                if (index === data.itemsList.length - 1) {
                    console.log(`  { name: '${e.name}', cost: ${e.cost} }`)
                } else {
                    console.log(`  { name: '${e.name}', cost: ${e.cost} },`)
                }
            });
            console.log("]");
            process.stdout.write(prompt);
            process.stdin.resume();
		} else {
			console.log(`Invalid command: ${command}`);
            process.exit(0);
        }
    }
});

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/catalog", (request, response) => {
    let itemsTable = `<table border='1'><thead style="text-align: center;"><td><strong>Item</strong></td><td><strong>Cost</strong></td></thead>`;
    data.itemsList.forEach(e => {
        itemsTable += `<tr><td>${e.name}</td><td>${e.cost.toFixed(2)}</td></tr>`;
    });
    itemsTable += `</table>`;
    response.render("displayItems", { itemsTable });
});

app.get("/order", (request, response) => {
    let items;
    data.itemsList.forEach(e => items += `<option>${e.name}</option>`);
    response.render("placeOrder", { items });
});

app.use(bodyParser.urlencoded({extended:false}));

app.post("/order", (request, response) => {
    const itemsSelected = request.body.itemsSelected;
    
    const itemsOrdered = itemsSelected.map(e => 
        data.itemsList.find(f => f.name === e)
    );
    
    let orderTable = `<table border='1'><thead style="text-align: center;"><td><strong>Item</strong></td><td><strong>Cost</strong></td></thead>`;
    
    itemsOrdered.forEach(e => {
        orderTable += `<tr><td>${e.name}</td><td>${e.cost.toFixed(2)}</td></tr>`
    });

    let totalCost = itemsOrdered.reduce((result, elem) => {
        return result + elem.cost;
    }, 0);

    orderTable += `<tr><td>Total Cost:</td><td>${totalCost.toFixed()}</td></tr></table>`;

    const variables = { name: request.body.name,
                        email: request.body.email,
                        delivery: request.body.delivery,
                        orderTable: orderTable };
    response.render("orderConfirmation", variables);
});

app.listen(portNumber);