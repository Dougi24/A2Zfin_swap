Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ""; //Server url from moralis.io

let currentTrade = {};
let currentSelectSide;
let tokens;

//Sign-in to metamask function
async function login() {
    try {
        currentUser = Moralis.User.current();
        if(!currentUser){
            currentUser = await Moralis.Web3.authenticate();
        }
        document.getElementById("swap_button").disabled=false;
        } catch (error) {
        console.log(error);
    }
}
//Entry point to init
async function init(){
    await Moralis.initPlugins();
    await Moralis.enable();
    await listAvailableTokens();
    currentUser = Moralis.User.current();
        if(currentUser){
            document.getElementById("swap_button").disabled=false;
        }
}
//Function to list the available tokens supported by oneInch
async function listAvailableTokens() {
    const result = await Moralis.Plugins.oneInch.getSupportedTokens({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
    });
    let parent = document.getElementById("token_list");
    tokens = result.tokens;
    for(const address in tokens){
        let token=tokens[address];
        let div = document.createElement("div");
        div.setAttribute("data-address", address)
        div.className="token_row";
        let html = `
        <img class="token_list_img" src="${token.logoURI}">
        <span class="token_list_text">${token.symbol}</span>
        `
        div.innerHTML=html;
        div.onclick= (()=>{selectToken(address)});
        parent.appendChild(div);
    }
}
//To select a token from the listAvailableTokens
function selectToken(address) {
    closeModel();
    //let address = event.target.getAttribute("data-address");
    currentTrade[currentSelectSide]= tokens[address];
    console.log(currentTrade);
    renderInterface();
    getQuote();
}
//To change to the selected token icon
function renderInterface() {
    if(currentTrade.from){
        document.getElementById("from_token_img").src=currentTrade.from.logoURI;
        document.getElementById("from_token_text").innerHTML=currentTrade.from.symbol;
    }
    if(currentTrade.to){
        document.getElementById("to_token_img").src=currentTrade.to.logoURI;
        document.getElementById("to_token_text").innerHTML=currentTrade.to.symbol;
    }
}
//A modal to show all the available tokens
function openModal(side) {
    currentSelectSide=side;
    document.getElementById("token_model").style.display="block";
    
}
//To close all the available tokens modal
function closeModel() {
    document.getElementById("token_model").style.display="none";
    
}
//To get the quote of the transaction
async function getQuote() {
    if(!currentTrade.from && !currentTrade.to && !document.getElementById("from_amount").Value)return;
    let amount =Number(
        document.getElementById("from_amount").value * 10**currentTrade.from.decimals
    );   
    const quote = await Moralis.Plugins.oneInch.quote({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
        fromTokenAddress: currentTrade.from.address, // The token you want to swap
        toTokenAddress: currentTrade.to.address, // The token you want to receive
        amount: amount,
      });
      console.log(quote);
      document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
      document.getElementById("to_amount").value = quote.toTokenAmount/ (10**currentTrade.from.decimals);
      
}
//To begin the swap process
async function trySwap(){
    let address = Moralis.User.current().get("ethAddress");
    let amount = Number(
        document.getElementById("from_amount").value * 10**currentTrade.from.decimals);
    if(currentTrade.from.symbol !== 'ETH'){
            const allowance = await Moralis.Plugins.oneInch.hasAllowance({
                chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
                fromTokenAddress: currentTrade.from.address, // The token you want to swap
                fromAddress: address, // Your wallet address
                amount: amount,
              });
              console.log(`The user has enough allowance: ${allowance}`);
            if(!allowance){
                await Moralis.Plugins.oneInch.approve({
                chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
                tokenAddress: currentTrade.from.address, // The token you want to swap
                fromAddress: address, // Your wallet address
                });
            }
        }
        let receipt = await doSwap(address, amount);
        alert("Swap Complete");
}
//To confirm the the swap tranction and do it
async function doSwap(userAddress, amount) {
    return  Moralis.Plugins.oneInch.swap({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
        fromTokenAddress: currentTrade.from.address, // The token you want to swap
        toTokenAddress: currentTrade.to.address, // The token you want to receive
        amount: amount,
        fromAddress: userAddress, // Your wallet address
        slippage: 1,
      }); 
}


  
init();
//Getting the element from the HTML code
document.getElementById("login_button").onclick = login;
document.getElementById("from_token_select").onclick = (()=> {openModal("from")});
document.getElementById("to_token_select").onclick = (()=> {openModal("to")});
document.getElementById("model_close").onclick = closeModel;
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("swap_button").onclick = trySwap;

document.getElementById("limit_home").onclick = limit_home;
document.getElementById("swap_home").onclick = swap_home;