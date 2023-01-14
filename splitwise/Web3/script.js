if (typeof web3 !== 'undefined')  {
	web3 = new Web3(web3.currentProvider);
} else {
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
}
web3.eth.defaultAccount = '0x2A5933B343fb84D7E2af575f3ACF0706a08e0148'

// console.log(web3.eth);
// Default account is the first one

const GENERATOR = '0x0000000000000000000000000000000000000000000000000000000000000000'

var abi = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			},
			{
				"internalType": "int32",
				"name": "amount",
				"type": "int32"
			}
		],
		"name": "add_IOU",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			},
			{
				"internalType": "int32",
				"name": "amount",
				"type": "int32"
			}
		],
		"name": "addDebt",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "amountOwed",
		"outputs": [
			{
				"internalType": "int32",
				"name": "",
				"type": "int32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getUsers",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "ret",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			}
		],
		"name": "lookup",
		"outputs": [
			{
				"internalType": "int32",
				"name": "ret",
				"type": "int32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "splitwiseUsers",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

abiDecoder.addABI(abi)

var smartContract = new web3.eth.Contract(abi);
var smartContractFunctions = new web3.eth.Contract(abi, '0xa1ec1Ed2e48f1f9Cc47ADb6656Fa179Df9B7627D');
//var smartContractFunctions = smartContract.at('0x2A5933B343fb84D7E2af575f3ACF0706a08e0148')
async function getUsers() {
	//return smartContractFunctions.methods.getUsers;
	//return smartContractFunctions.getUsers();
	//let users =  smartContractFunctions.methods.getUsers()._method.signature;
	const users = await contract.methods.getUsers().call();
	console.log(users);
}

function lookup(debtor, creditor) {
	return smartContractFunctions.lookup(debtor, creditor).c[0];
}

// TODO: Get the total amount owed by the user specified by 'user'
function getAmountOwed(user) {
	let owedAmount = 0;
	const users = getUsers();
	if(users != undefined){
		console.log(users);
	for (let i = 0; i < users.length; i++){
		// console.log(user, users[i], lookup(user, users[i]));
		owedAmount += lookup(user, users[i]);
	}
	}
	
	return owedAmount;
}

// TODO: Get the last time this user has sent or received an IOU, in seconds since Jan. 1, 1970
// Return null if you can't find any activity for the user.
// HINT: Try looking at the way 'getAllFunctionCalls' is written. You can modify it if you'd like.
function getLastActive(user) {
	let functionCalls = getAllFunctionCalls('0x31DEcC19135C9cA828cBD3BC226993ECAb8A410D', add_IOU);
	functionCalls = functionCalls
		.filter((functionCall) => functionCall.from === user || functionCall.args[0] === user)
		.sort((a, b) => a.timestamp > b.timestamp);
	if (functionCalls.length > 0) 
		return functionCalls[0].timestamp
	return null
}

// TODO: add an IOU ('I owe you') to the system
// The person you owe money is passed as 'creditor'
// The amount you owe them is passed as 'amount'
function add_IOU(creditor, amount) {
	var path = doBFS(creditor, web3.eth.defaultAccount, getNeighbors)
	console.log(path);
	
	var min = 0;
	if (path !== null){
		min = amount;
		for (var i = 0; i < path.length - 1; i++){
			var amount2 = lookup(path[i], path[i + 1])
			if (amount2 < min)
				min = amount2;
		}
		// console.log("minimum", min);
		for(var i = 0; i < path.length - 1; i++){
			smartContractFunctions.addDebt(path[i], path[i+1], -min)	
		}
		
	}
	smartContractFunctions.add_IOU(creditor, amount - min,{gas:300000});
	// console.log("path", path)
}

function getNeighbors(user) {
	var neighbors = [];
	var users = getUsers();
	for (var i = 0; i < users.length; i++)
		if(lookup(user, users[i]) > 0)
			neighbors.push(users[i]);
	// console.log("user", user, neighbors)
	return neighbors;	
}

function getAllFunctionCalls(addressOfContract, functionName) {
	var curBlock = web3.eth.blockNumber;
	console.log(curBlock);
	var function_calls = [];
	while (curBlock !== GENERATOR) {
	  var b = web3.eth.getBlock(curBlock, true);
	  var txns = b.transactions;
	  for (var j = 0; j < txns.length; j++) {
	  	var txn = txns[j];
	  	// check that destination of txn is our contract
	  	if (txn.to === addressOfContract) {
	  		var func_call = abiDecoder.decodeMethod(txn.input);
	  		// check that the function getting called in this txn is 'functionName'
	  		if (func_call && func_call.name === functionName) {
	  			var args = func_call.params.map(function (x) {return x.value});
	  			function_calls.push({
	  				from: txn.from,
	  				args: args,
	  				timestamp: b.timestamp
	  			})
	  		}
	  	}
	  }
	  curBlock = b.parentHash;
	}
	return function_calls;
};

function doBFS(start, end, getNeighbors) {
	var queue = [[start]];
	while (queue.length > 0) {
		var cur = queue.shift();
		var lastNode = cur[cur.length-1]
		if (lastNode === end) {
			return cur;
		} else {
			var neighbors = getNeighbors(lastNode);
			for (var i = 0; i < neighbors.length; i++) {
				queue.push(cur.concat([neighbors[i]]));
			}
		}
	}
	return null;
}

function timeConversion(time){
    if (time === null) return "unknown";
    var a = new Date(time * 1000);
    return a.toLocaleString("en-US");
};

$("#total_owed").html("$"+getAmountOwed(web3.eth.defaultAccount));
$("#last_active").html(timeConversion(getLastActive(web3.eth.defaultAccount)));

$("#personalaccount").change(function() {
	web3.eth.defaultAccount = '0x31DEcC19135C9cA828cBD3BC226993ECAb8A410D';
	$("#total_owed").html("$"+getAmountOwed(web3.eth.defaultAccount));
	$("#last_active").html(timeConversion(getLastActive(web3.eth.defaultAccount)))
});

// Allows switching between accounts in 'My Account' and the 'fast-copy' in 'Address of person you owe
const options = web3.eth.accounts.map(function (a) { return '<option value="'+a+'">'+a+'</option>' })
$(".account").html(options);
$(".wallet_addresses").html(web3.eth.accounts.map(function (a) { return '<li>'+a+'</li>' }))

// This code updates the 'Users' list in the UI with the results of your function
$("#all_users").html(getUsers().map(function (u,i) { return "<li>"+u+"</li>" }));

// This runs the 'add_IOU' function when you click the button
// It passes the values from the two inputs above


// $("#addiou").click(function() {
// 	console.log('Button clicked!!');
//   add_IOU($("#creditor").val(), $("#amount").val());
//   window.location.reload(true); // refreshes the page after
// });

function clicker(){
  add_IOU($("#creditor").val(), $("#amount").val());
  window.location.reload(true); // refr
}