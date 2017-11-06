// SPDX-License-Identifier: Apache-2.0

/*
  Sample Chaincode based on Demonstrated Scenario

 This code is based on code written by the Hyperledger Fabric community.
  Original code can be found here: https://github.com/hyperledger/fabric-samples/blob/release/chaincode/fabcar/fabcar.go
 */

package main

/* Imports  
* 4 utility libraries for handling bytes, reading and writing JSON, 
formatting, and string manipulation  
* 2 specific Hyperledger Fabric specific libraries for Smart Contracts  
*/ 
import (
	"time"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

// Define the Smart Contract structure
type SmartContract struct {
}

/* Define Tuna structure, with 4 properties.  
Structure tags are used by encoding/json library
*/
type Tuna struct {
	Hospital string `json:"hospital"`
	DateClaim string `json:"dateClaim"`
	Name string `json:"name"`
	ICD10  string `json:"icd10"`
	Price  string `json:"price"`
	Status string `json:"status"`
}

/*
 * The Init method *
 called when the Smart Contract "tuna-chaincode" is instantiated by the network
 * Best practice is to have any Ledger initialization in separate function 
 -- see initLedger()
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
 * The Invoke method *
 called when an application requests to run the Smart Contract "tuna-chaincode"
 The app also specifies the specific smart contract function to call with args
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {
	fmt.Println("Invokeee1")
	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger
	fmt.Println("Invokeee2")
	if function == "queryTuna" {
		return s.queryTuna(APIstub, args)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "recordTuna" {
		return s.recordTuna(APIstub, args)
	} else if function == "queryAllTuna" {
		return s.queryAllTuna(APIstub)
	} else if function == "changeTunaHolder" {
		return s.changeTunaHolder(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

/*
 * The queryTuna method *
Used to view the records of one particular tuna
It takes one argument -- the key for the tuna in question
 */
func (s *SmartContract) queryTuna(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	tunaAsBytes, _ := APIstub.GetState(args[0])
	if tunaAsBytes == nil {
		return shim.Error("Could not locate tuna")
	}
	return shim.Success(tunaAsBytes)
}

/*
 * The initLedger method *
Will add test data (10 tuna catches)to our network
 */
func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	tuna := []Tuna{
		Tuna{Hospital: "923F",DateClaim: "11/11/11", Name: "milk", ICD10: "1504054225", Price: "Miriam", Status:"true"},
		Tuna{Hospital: "M83T",DateClaim: "11/11/11", Name: "eiei", ICD10: "1504057825", Price: "Dave", Status:"true"},
		Tuna{Hospital: "T012",DateClaim: "11/11/11", Name: "donut", ICD10: "1493517025", Price: "Igor", Status:"true"},
		Tuna{Hospital: "P490",DateClaim: "11/11/11", Name: "polar", ICD10: "1496105425", Price: "Amalea", Status:"true"},
		Tuna{Hospital: "S439",DateClaim: "11/11/11", Name: "bear", ICD10: "1493512301", Price: "Rafa", Status:"true"},
		Tuna{Hospital: "J205",DateClaim: "11/11/11", Name: "kiku", ICD10: "1494117101", Price: "Shen", Status:"true"},
		Tuna{Hospital: "S22L",DateClaim: "11/11/11", Name: "mumi", ICD10: "1496104301", Price: "Leila", Status:"true"},
		Tuna{Hospital: "EI89",DateClaim: "11/11/11", Name: "bottle", ICD10: "1485066691", Price: "Yuan", Status:"true"},
		Tuna{Hospital: "129R",DateClaim: "11/11/11", Name: "macair", ICD10: "1485153091", Price: "Carlo", Status:"true"},
		Tuna{Hospital: "49W4",DateClaim: "11/11/11", Name: "Charger", ICD10: "1487745091", Price: "Fatima", Status:"true"},
	}

	i := 0
	for i < len(tuna) {
		fmt.Println("i is ", i)
		tunaAsBytes, _ := json.Marshal(tuna[i])
		APIstub.PutState(strconv.Itoa(i+1), tunaAsBytes)
		fmt.Println("Added", tuna[i])
		i = i + 1
	}

	return shim.Success(nil)
}

/*
 * The recordTuna method *
Fisherman like Sarah would use to record each of her tuna catches. 
This method takes in five arguments (attributes to be saved in the ledger). 
 */
func (s *SmartContract) recordTuna(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	fmt.Printf("-lenn Argument ==> Bc %d", len(args))
	fmt.Println("-Argument ==> Bc[1] %s", args[1])
	fmt.Println("-Argument ==> Bc[2] %s", args[2])
	fmt.Println("-Argument ==> Bc[3] %s", args[3])
	fmt.Println("-Argument ==> Bc[4] %s", args[4])
	fmt.Println("-Argument ==> Bc[5] %s", args[5])
	fmt.Println("-Argument ==> Bc[6] %s", args[6])
	fmt.Println("-Argument ==> Bc[7] %s", args[0])
	if len(args) != 7 {
		return shim.Error("Incorrect number of arguments. Expecting 7 ==> ")
	}

var tuna = Tuna{ Name: args[1],Hospital: args[2], ICD10: args[3], DateClaim: args[4], Price: args[5], Status: args[6] }
	
	startKey := "0"
	endKey := "999"

	resultsIterator, err1 := APIstub.GetStateByRange(startKey, endKey)
	fmt.Println("-RecordClaim")
	if err1 != nil {
		return shim.Error(err1.Error())
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
	
		tunaNow := Tuna{}
		json.Unmarshal(queryResponse.Value, &tunaNow)
		if tuna.Status == "approve" {
			if tunaNow.Name == tuna.Name && tunaNow.Hospital == tuna.Hospital && 
				tunaNow.ICD10 == tuna.ICD10 && tunaNow.DateClaim == tuna.DateClaim && 
				tunaNow.Price == tuna.Price {
				fmt.Println("-Argument ==> status", tuna.Status)
				if tunaNow.Status == "approve" {
					return shim.Error(fmt.Sprintf("dup claim!"))
				}	
			}
		}
	}


	tunaAsBytes, _ := json.Marshal(tuna)
	err := APIstub.PutState(args[0], tunaAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to record tuna catch: %s", args[0]))
	}

	return shim.Success(nil)
}

/*
 * The queryAllTuna method *
allows for assessing all the records added to the ledger(all tuna catches)
This method does not take any arguments. Returns JSON string containing results. 
 */
func (s *SmartContract) queryAllTuna(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "0"
	endKey := "999"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	type AuditHistory struct {
		TxId    string   `json:"txId"`
		Value   Tuna   `json:"value"`
		Timestamp string `json:"timestamp"`
	}

	var history []AuditHistory;
	marble := Tuna{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		resultsIterator1, err1 := APIstub.GetHistoryForKey(queryResponse.Key)
		if err1 != nil {
			return shim.Error(err1.Error())
		}
		defer resultsIterator1.Close()

		for resultsIterator1.HasNext() {
			historyData, err := resultsIterator1.Next()
			if err != nil {
				return shim.Error(err.Error())
			}
			var tx AuditHistory
			tx.TxId = historyData.TxId                     //copy transaction id over
			tx.Timestamp = time.Unix(historyData.Timestamp.Seconds, int64(historyData.Timestamp.Nanos)).String()
			json.Unmarshal(historyData.Value, &marble)     //un stringify it aka JSON.parse()
			if historyData.Value == nil {                  //marble has been deleted
				var emptyMarble Tuna
				tx.Value = emptyMarble                 //copy nil marble
			} else {
				json.Unmarshal(historyData.Value, &marble) //un stringify it aka JSON.parse()
				tx.Value = marble                      //copy marble over
			}
			history = append(history, tx)              //add this tx to the list
			fmt.Println("- history:%+v", tx)
		}
		
	}

	historyAsBytes, _ := json.Marshal(history)     //convert to array of bytes
	return shim.Success(historyAsBytes)
}

/*
 * The changeTunaHolder method *
The data in the world state can be updated with who has possession. 
This function takes in 2 arguments, tuna id and new holder name. 
 */
func (s *SmartContract) changeTunaHolder(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	fmt.Println("-ChangeTuna ==> Bc[0] %s", args[0])
	fmt.Println("-Change ==> Bc[1] %s", args[1])
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	tunaAsBytes, _ := APIstub.GetState(args[0])
	if tunaAsBytes == nil {
		return shim.Error("Could not locate tuna")
	}
	tuna := Tuna{}

	json.Unmarshal(tunaAsBytes, &tuna)
	// Normally check that the specified argument is a valid holder of tuna
	// we are skipping this check for this example
	tuna.Status = args[1]
	fmt.Println("-ChangeStatus ==> Bc[1] %s", tuna.Status)
	tunaAsBytes, _ = json.Marshal(tuna)
	err := APIstub.PutState(args[0], tunaAsBytes)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to change tuna holder: %s", args[0]))
	}

	return shim.Success(nil)
}

/*
 * main function *
calls the Start function 
The main function starts the chaincode in the container during instantiation.
 */
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
