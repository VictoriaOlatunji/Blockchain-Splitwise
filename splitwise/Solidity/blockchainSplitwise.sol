// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//A decentralized app to keep track of who owes who money within a group of people
contract splitwise {
    mapping(address => mapping (address => int32)) public amountOwed; 

    address[] public splitwiseUsers;

    //function lookup to know the amount the debtor owes the creditor
    function lookup(address debtor, address creditor) public view returns (int32 ret){
        ret = amountOwed[debtor][creditor];
      }
    
    //function add_IOU add more money owed to the creditor
    function add_IOU(address creditor, int32 amount) public {
        addDebt(msg.sender, creditor, amount);
      }

    //function to add to the amount the debtor owes the creditor and also add as users
    function addDebt(address debtor, address creditor , int32 amount) public{
        amountOwed[debtor][creditor] += amount;
        addToUsers(creditor);
        addToUsers(debtor);
      }

    //function to add users  
    function addToUsers(address add) private {
        for (uint i = 0; i < splitwiseUsers.length; i++){
            if (splitwiseUsers[i] == add)
            return;
            }
        splitwiseUsers.push(add);
      }
    
    //function to get users
    function getUsers() public view returns (address[] memory){
        return splitwiseUsers;
        
    }
}