// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

var rowCount;
var firstValid;

function selectPricingList(event) {
    setProgress('picking file', 0);
    var files = event.target.files;
    var file = files[0];
    var fileInfo = `
          - FileName: ${file.name || 'n/a'}<br>
          - FileType: ${file.type || 'n/a'}<br>
          - FileSize: ${file.size} bytes<br>
          - LastModified: ${file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a'}
        `;
    setProgress('reading file ' + fileInfo, 0);
    
    var container = document.getElementById('imported_data_container');
    document.getElementById('import_loaded_data').style.display = 'none';
    // request the files to load
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function (event) {
        // clear the old data
        container.innerHTML = "";
        previousValues = [];
        rowCount = 0;
        firstValid = null;
        // and load the data
        var csv = event.target.result;
        var data = $.csv.toArrays(csv);
        for (var i = 0; i < data.length; ++i) {
            // trim all the imported data on this row
            for (var j = 0; j < data[i].length; ++j) {
                data[i][j] = data[i][j].trim();
            }
            // and display it
            displayImportedRow(container, data[i]);
            updateProgress(i / data.length);
        }
        setProgress(file.name + " loaded " + data.length + " rows", 1);
        document.getElementById('import_loaded_data').style.display = null;
    };
}

function setProgress(text, value) {
    document.getElementById('progress_text').innerHTML = text;
    updateProgress(value);
}

function updateProgress(value) {
    document.getElementById('progress_display').value = value;
}

function isNormalInteger(str) {
    return /^\+?\d+$/.test(str);
}

function getCurrencyValue(str) {
    if(str.indexOf('.') === -1 ||                   // no decimal place
       str.toUpperCase().indexOf('MOQ') !== -1 ||   // MOQ (min order quantity)
       str.toUpperCase().indexOf('MIN') !== -1)     // Min order specified instead
    {
        // there is no decimal place, or there is this is not correct
        return null;
    }
    else {
        return Number(str.replace(/[^0-9\.]+/g,""));
    }
}

function displayImportedRow(tableContainer, dataRow) {
    /* this is what we want to create
    <tr>
        <td>CheckBox</td>
        <td>Category</td>
        <td>Item Name</td>
        <td>Item Quality</td>
        <td>Item Quantity</td>
        <td>GBP</td>
        <td>USD</td>
        <td>AUD</td>
        <td>Notes</td>
    </tr>
    */

    // there are a lot of rows that are not valid in these sheets (headers mostly)
    // so to filter these out we can use the fact that EVERYTHING HAS A QUANTITY
    var isImportChecked = false;
    if (dataRow.length > 2 && isNormalInteger(dataRow[3])) {
        // long enough and the third item is a valid quantity string
        isImportChecked = true;
    }

    // while the previous values array is not long enough, grow it
    while(previousValues.length < dataRow.length) {
        previousValues.push('');
    }

    var rowDiv = document.createElement('tr');
    rowDiv.id = 'row_' + ++rowCount;
    // create the checkbox div
    var colDiv = document.getElementById('template_import_check').cloneNode(true);
    colDiv.id = 'import_container_' + rowCount;
    // re-id the children of this checkbox container, first the check box
    var importCheck = colDiv.querySelector('#import');
    importCheck.id = "import_check_" + rowCount;
    importCheck.checked = isImportChecked;
    // then the label for the check box
    var importLabel = colDiv.querySelector('#import_label');
    importLabel.id = "import_label_" + rowCount;
    importLabel.setAttribute('for', importCheck.id);
    // and append this div
    rowDiv.appendChild(colDiv);

    var isAnyDataValid = false;
    for (var i = 0; i < dataRow.length; ++i) {
        var colDiv = document.createElement('td');
        var dataEntry = dataRow[i];
        if (dataEntry) {
            // remember this valid data to copy down to empty cells below
            previousValues[i] = dataEntry;
            if (isImportChecked && i > 3 && i < 7) {
                // try to convert the currency numbers here to show what we will do
                var currencyValue = getCurrencyValue(dataEntry);
                if (currencyValue) {
                    dataEntry = currencyValue.toFixed(2);
                }
            }
            isAnyDataValid = true;
        }
        else if (isImportChecked) {
            // else, for values to import; use that previous value
            dataEntry = previousValues[i];
        }
        // set this data accordingly
        colDiv.innerHTML = dataEntry;
        rowDiv.appendChild(colDiv);
    }
    // only append the child if there was something in the array (else this will simply duplicate the one before)
    if (isAnyDataValid) {
        // data is valid, append to the table
        if (isImportChecked || !firstValid) {
            // will import this, put on the bottom
            tableContainer.appendChild(rowDiv);
            if (!firstValid && isImportChecked) {
                // this is the first valid one
                firstValid = rowDiv;
            }
        }
        else {
            // there was something valid added, add just before this one
            tableContainer.insertBefore(rowDiv, firstValid);
        }
    }
}

function splitId(elementToSplit) {
    var idString = elementToSplit.id;
    var index = idString.lastIndexOf('_');
    return [idString.substring(0, index), idString.substring(index + 1, idString.length)];
}

var lastCategoryId;
var lastItemId;
var lastQuantityId;
var lastCategoryData;
var lastItemData;
var lastQuantityData;
var importChildIndex;
var tableContainer;
var importRow;

function importLoadedData() {
    // we will do a row at a time (asynchronous calls involved) - start everything off
    lastCategoryId = null;
    lastItemId = null;
    lastQuantityId = null;
    lastCategoryData = null;
    lastItemData = null;
    lastQuantityData = null;
    importChildIndex = 0;
    tableContainer = document.getElementById('imported_data_container');
    var childCount = tableContainer.children.length;

    setProgress('importing ' + childCount + ' potential rows of data', importChildIndex / childCount);

    // and import the first row
    importLoadedDataRow();
}

function importLoadedDataRow() {
    // import all the data we loaded into the table here
    updateProgress(importChildIndex / tableContainer.children.length);
    if (importChildIndex < tableContainer.children.length) {
        // we have another row to import, so import it here
        importRow = tableContainer.children[importChildIndex];
        // have the row of data to import, get the ID so we can find the checkbox to see if we want to import
        var idNumber = splitId(importRow)[1];
        var importCheck = importRow.querySelector('#import_check_' + idNumber);
        if (importCheck.checked) {
            // this is ready to import, get the category first
            importCategory();
        }
        else {
            // we don't do this row - just move onto the next (probably won't recurse much here)
            importNextDataRow();
        }
    }
    else {
        // we are done
        setProgress('imported all data ', 1);
    }
}

function importNextDataRow() {
    ++importChildIndex;
    importLoadedDataRow();
}

function importCategory() {
    // we want to import our category here, have we already?
    var categoryName = importRow.children[1].innerHTML;
    if (lastCategoryData && lastCategoryData.name_lc === firebaseData.lcRef(categoryName)) {
        // we don't need to get the category - we already have it loaded
        importItem();
    }
    else {
        // we need to get this category, or create it if it doesn't already exist
        firebaseData.getCategoryByName(categoryName, 
            function(querySnapshot) {
                // have the result, create the data we want
                lastCategoryData = firebaseData.defaultCategory(categoryName);
                if (querySnapshot.empty) {
                    // there are none, create a new one
                    firebaseData.addNewItemCategory(lastCategoryData,
                        function(newDoc) {
                            // this worked, remember the ID of this
                            lastCategoryId = newDoc.id;
                            // and import the item from the row of data
                            importItem();
                        },
                        function(error) {
                            // this failed
                            console.log("Failed to add a new category ", error);
                            setProgress(("failed to proceed when creating a new category '" + categoryName + "' ", error), 0);
                        });
                }
                else {
                    // use the first one from the snapshot
                    querySnapshot.forEach(function (doc) {
                        // have the doc, one at least, use this
                        lastCategoryId = doc.id;
                        // also, while we are here update this in case anything changed
                        firebaseData.updateCategoryData(doc.id, lastCategoryData,
                            function() {
                                // this worked, fine
                            },
                            function(error) {
                                // this failed for some reason
                                console.log('Failed to update the document', error);
                            });
                        // and import the item from the row of data
                        importItem();
                        // just use this one
                        return;
                    });
                }
            },
            function(error) {
                // failed to get one
                console.log("Failed to find the category ", error);
                setProgress(("failed to proceed when searching for category '" + categoryName + "' ", error), 0);
            });
    }
}

function importItem() {
    // we want to import our item here, to the loaded category
    var itemName = importRow.children[2].innerHTML;
    var quality = importRow.children[3].innerHTML;
    if (lastItemData && lastItemData.name_lc === firebaseData.lcRef(itemName)) {
        // we don't need to get the item - we already have it loaded
        importItemQuantity();
    }
    else {
        // we need to get this item, or create it if it doesn't already exist
        firebaseData.getItemInCategoryByName(lastCategoryId, itemName,
            function(querySnapshot) {
                // have the result, create the data we want
                lastItemData = firebaseData.defaultItem(lastCategoryId, lastCategoryData, itemName, quality);
                if (querySnapshot.empty) {
                    // there are none, create a new one
                    firebaseData.addNewItem(lastItemData,
                        function(newDoc) {
                            // this worked, remember the ID of this new data
                            lastItemId = newDoc.id;
                            // and import the item quantity from the row of data
                            importItemQuantity();
                        },
                        function(error) {
                            // this failed
                            console.log("Failed to add a new item ", error);
                            setProgress(("failed to proceed when creating a new item '" + itemName + "' ", error), 0);
                        });
                }
                else {
                    // use the first one from the snapshot
                    querySnapshot.forEach(function (doc) {
                        // have the doc, one at least, use this ID
                        lastItemId = doc.id;
                        // also, while we are here update this in case anything changed
                        firebaseData.updateItemData(doc.id, lastItemData,
                            function() {
                                // this worked, fine
                            },
                            function(error) {
                                // this failed for some reason
                                console.log('Failed to update the document', error);
                            });
                        // and import the item quantity from the row of data
                        importItemQuantity();
                        // just use this one
                        return;
                    });
                }
            },
            function(error) {
                // failed to get one
                console.log("Failed to get the item ", error);
                setProgress(("failed to proceed when searching for item '" + itemName + "' ", error), 0);
            });
    }
}

function importItemQuantity() {
    // we want to import our item here, to the loaded category
    var quantityNumber = Number(importRow.children[4].innerHTML);
    
    var tableValue = importRow.children[5].innerHTML;
    var gbp = getCurrencyValue(tableValue);
    var gbp_notes = '';
    if (!gbp) {
        // set the comment on this instead
        gbp_notes = tableValue;
    }
    tableValue = importRow.children[6].innerHTML;
    var usd = getCurrencyValue(tableValue);
    var usd_notes = '';
    if (!usd) {
        // set the comment on this instead
        usd_notes = tableValue;
    }
    tableValue = importRow.children[7].innerHTML;
    var aud = getCurrencyValue(tableValue);
    var aud_notes = '';
    if (!aud) {
        // set the comment on this instead
        aud_notes = tableValue;
    }
    var notes = '';
    if (importRow.children.length > 8) {
        notes = importRow.children[8].innerHTML;
    }

    if (lastQuantityData && lastQuantityData.quantity === quantityNumber) {
        // we don't need to get the item quantity - we already have it loaded - don't do it twice!
        importNextDataRow();
    }
    else {
        // we need to get this item quantity, or create it if it doesn't already exist
        firebaseData.getItemQuantityByNumber(lastItemId, quantityNumber,
            function(querySnapshot) {
                // have the result
                lastQuantityData = firebaseData.defaultQuantity(lastItemId, lastItemData, quantityNumber, gbp, gbp_notes, usd, usd_notes, aud, aud_notes, notes);
                if (querySnapshot.empty) {
                    // there are none, create a new one
                    firebaseData.addNewQuantity(lastQuantityData,
                        function(newDoc) {
                            // this worked, remember the id of this new document
                            lastQuantityId = newDoc.id;
                            // and import the next row of data now we are done with this one
                            importNextDataRow();
                        },
                        function(error) {
                            // this failed
                            console.log("Failed to add a new quantity ", error);
                            setProgress(("failed to proceed when creating a new item quantity '" + quantityNumber + "' ", error), 0);
                        });
                }
                else {
                    // use the first one from the snapshot
                    querySnapshot.forEach(function (doc) {
                        // have the doc, one at least, use this - remembering the id
                        lastQuantityId = doc.id;
                        // also, while we are here update this in case anything changed
                        firebaseData.updateQuantityData(doc.id, lastQuantityData,
                            function() {
                                // this worked, fine
                            },
                            function(error) {
                                // this failed for some reason
                                console.log('Failed to update the document', error);
                            });
                        // and import the next row of data now we are done with this one
                        importNextDataRow();
                        // just use this one
                        return;
                    });
                }
            },
            function(error) {
                // failed to get one
                console.log("Failed to find a quantity ", error);
                setProgress(("failed to proceed when searching for item quantity '" + quantityNumber + "' ", error), 0);
            });
    }
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported, bind the button change to the function
        //$('#files').bind('change', selectPricingList);
        document.getElementById('files').style.display = null;
        document.getElementById('files').onchange = function(event) {
            selectPricingList(event);
        };
        return true;
    } else {
        // source: File API availability - http://caniuse.com/#feat=fileapi
        // source: <output> availability - http://html5doctor.com/the-output-element/

        var container = document.getElementById('imported_data_container');
        container.innerHTML += ('The HTML5 APIs used in this form are only available in the following browsers:<br />');
        // 6.0 File API & 13.0 <output>
        container.innerHTML += (' - Google Chrome: 13.0 or later<br />');
        // 3.6 File API & 6.0 <output>
        container.innerHTML += (' - Mozilla Firefox: 6.0 or later<br />');
        // 10.0 File API & 10.0 <output>
        container.innerHTML += (' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
        // ? File API & 5.1 <output>
        container.innerHTML += (' - Safari: Not supported<br />');
        // ? File API & 9.2 <output>
        container.innerHTML += (' - Opera: Not supported');
        return false;
    }
});