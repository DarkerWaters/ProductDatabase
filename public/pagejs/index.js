// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

function checkUserState() {
    var user = firebaseData.getUser();
    if (user) {
        // logged in - hide this
        document.getElementById('not_logged_in').style.display = 'none';
        document.getElementById('submit_access_reminder').style.display = 'none';
        document.getElementById('not_reader').style.display = null;
        document.getElementById('login_explanation').style.display = null;
        firebaseData.getUserData(user,
            function(firebaseUserData) {
                // got the data
                if (firebaseData.isUserReader(firebaseUserData)) {
                    // we are a reader
                    document.getElementById('not_reader').style.display = 'none';
                    document.getElementById('login_explanation').style.display = 'none';
                }
                else {
                    // not a reader
                    document.getElementById('not_reader').style.display = null;
                    populateRegistrationForm(firebaseUserData);
                }
                if (firebaseUserData['isRequestPending']) {
                    // let them send their reminder as the request is pending
                    document.getElementById('submit_access_reminder').style.display = null;
                }
            }),
            function(error) {
                // failed
                console.log('failed to get the user data to see if a reader', error);
                document.getElementById('not_reader').style.display = null;
            }
    }
    else {
        // not logged in, show this
        document.getElementById('not_logged_in').style.display = null;
        document.getElementById('not_reader').style.display = 'none';
        document.getElementById('submit_access_reminder').style.display = 'none';
    }
}

function populateRegistrationForm(firebaseUserData) {
    document.getElementById('user_name').value = firebaseUserData['name'];
    document.getElementById('user_email').value = firebaseUserData['email'];
    document.getElementById('user_company').value = firebaseUserData['company'];
    document.getElementById('user_phone').value = firebaseUserData['phone'];
    document.getElementById('user_tbm').value = firebaseUserData['trade'];
    document.getElementById('user_tbn').value = firebaseUserData['trade_no'];
}

function onSendReminderEmail() {
    // construct the reminder following a request submission
    var mail = document.createElement("a");
    mail.href = "mailto:INFO@DISRUPTSPORTS.COM"
                + "?subject="
                + "I would like access to your product database please"
                + "&body="
                + "From " + document.getElementById('user_name').value + ","
                + "%0D%0AEmail: " + document.getElementById('user_email').value
                + "%0D%0ACompany: " + document.getElementById('user_company').value
                + "%0D%0APhone: " + document.getElementById('user_phone').value
                + "%0D%0ATrade Body Member: " + document.getElementById('user_tbm').value
                + "%0D%0ATrade Body Number: " + document.getElementById('user_tbn').value
                + "%0D%0A."
                + "%0D%0AIf you could authorise this submission, I would very much appreciate it."
                ;
    mail.click();
}

function onSubmitAccessRequest() {
    // get the controls to get the data from
    var nameEdit = document.getElementById('user_name');
    // email is readonly
    //var emailEdit = document.getElementById('user_email');
    var companyEdit = document.getElementById('user_company');
    var phoneEdit = document.getElementById('user_phone');
    var tbmEdit = document.getElementById('user_tbm');
    var tbnEdit = document.getElementById('user_tbn');
    // create the data from their request here
    var newUserData = {
        // setup the blank user data here
        name: nameEdit.value,
        name_lc: firebaseData.lcRef(nameEdit.value),
        company: companyEdit.value,
        company_lc: firebaseData.lcRef(companyEdit.value),
        phone: phoneEdit.value,
        trade: tbmEdit.value,
        trade_no: tbnEdit.value,
        isRequestPending: true,
    };
    var user = firebaseData.getUser();
    if (user) {
        // and push this data to the database
        firebaseData.updateUserData(user, newUserData, function() {
                // this worked
                document.getElementById('user_message').innerHTML = "Request for access was submitted, you might want to contact your Disrupt Sports representative to speed things along...";
                checkUserState();
            },
            function(error) {
                // failed
                document.getElementById('user_message').innerHTML = "Sorry but we failed to send that request. Try logging on again or you might want to contact your Disrupt Sports representative.";
                
            });
    }
    else {
        // shouldn't be shown
        checkUserState();
    }
}

var categoriesFound;

function onCategoryFound(categoryContainer, resultContainer, categoryId, categoryData) {
    document.getElementById('search_results_none_container').style.display = 'none';
    if (categoriesFound.includes(categoryId)) {
        // already added
    }
    else {
        // remember we added this already
        categoriesFound.push(categoryId);
        // create a link for this found container
        var linkDiv = document.getElementById('template_category_link').cloneNode(true);
        // set the unique ID for this
        linkDiv.id = "link_category_" + categoryId;
        var links = linkDiv.getElementsByTagName('a');
        for (var i = 0; i < links.length; ++i) {
            links[i].id = "link_" + i + "_" + categoryId;
            links[i].href = '#' + categoryId;
            links[i].innerHTML = categoryData.name;
        }
        // and add to the container
        categoryContainer.appendChild(linkDiv);

        var resultDiv = document.getElementById('template_category_result').cloneNode(true);
        resultDiv.id = categoryId;
        // do the data for this
        setContainerData(resultDiv, 'category', 'name', categoryId, categoryData);
        setContainerData(resultDiv, 'category', 'description', categoryId, categoryData);
        setContainerData(resultDiv, 'category', 'notes', categoryId, categoryData);
        // and do the image
        var image = resultDiv.querySelector('#category_image');
        image.id = "category_image_" + categoryId;
        if (categoryData.image) {
            image.src = categoryData.image;
        }
        // also create the template for the category we found
        resultContainer.appendChild(resultDiv);
        var separator = document.createElement('hr');
        resultContainer.appendChild(separator);

        // we will also want to show all the items under this category
        firebaseData.getItemsInCategory(categoryId,
            function(querySnapshot) {
                // have all the items here, add them all to the category
                querySnapshot.forEach(function(doc) {
                    // for each doc (item) add the data
                    onItemFound(resultContainer, separator, doc.id, doc.data());
                })
            },
            function(error) {
                console.log('failed to find the items in a category', error);
            });
    }
}

function updateQuoteButton(itemId, quoteButton, gbpCheck, usdCheck, audCheck) {
    quoteButton.href = "/quote.html?itemId=" + itemId + "&gbp=" + gbpCheck.checked + "&usd=" + usdCheck.checked + "&aud=" + audCheck.checked;
    if (gbpCheck.checked || usdCheck.checked || audCheck.checked) {
        quoteButton.classList.remove('disabled');
    }
    else {
        quoteButton.classList.add('disabled');
    }
}

function onItemFound(resultContainer, separator, itemId, itemData) {
    var itemDiv = document.getElementById('template_item_result').cloneNode(true);
    itemDiv.id = itemId;
    // do the data for this
    setContainerData(itemDiv, 'item', 'name', itemId, itemData);
    setContainerData(itemDiv, 'item', 'quality', itemId, itemData);
    setContainerData(itemDiv, 'item', 'description', itemId, itemData);
    setContainerData(itemDiv, 'item', 'notes', itemId, itemData);
    setContainerData(itemDiv, 'item', 'url', itemId, itemData);
    // set the container data on the checkboxes - won't fill them but will set their IDs properly
    var gbpCheck = setContainerData(itemDiv, 'item', 'quote_gbp', itemId, null);
    var usdCheck = setContainerData(itemDiv, 'item', 'quote_usd', itemId, null);
    var audCheck = setContainerData(itemDiv, 'item', 'quote_aud', itemId, null);

    // listen to the check boxes
    var gbpLabel = setContainerData(itemDiv, 'item', 'quote_gbp_label', itemId, null);
    var usdLabel = setContainerData(itemDiv, 'item', 'quote_usd_label', itemId, null);
    var audLabel = setContainerData(itemDiv, 'item', 'quote_aud_label', itemId, null);
    var quoteButton = setContainerData(itemDiv, 'item', 'quote_button', itemId, null);

    // we need to listen to clicking to the labels to set the checkboxes they represent
    gbpLabel.onclick = function() {
        gbpCheck.checked = !gbpCheck.checked;
        updateQuoteButton(itemId, quoteButton, gbpCheck, usdCheck, audCheck);
    };
    usdLabel.onclick = function() {
        usdCheck.checked = !usdCheck.checked;
        updateQuoteButton(itemId, quoteButton, gbpCheck, usdCheck, audCheck);
    };
    audLabel.onclick = function() {
        audCheck.checked = !audCheck.checked;
        updateQuoteButton(itemId, quoteButton, gbpCheck, usdCheck, audCheck);
    };
    // do the initial button setup straight away
    updateQuoteButton(itemId, quoteButton, gbpCheck, usdCheck, audCheck);
    
    // and do the image
    var image = itemDiv.querySelector('#item_image');
    image.id = "item_image_" + itemId;
    if (itemData.image) {
        image.src = itemData.image;
    }
    // and the link
    var linkTitle = itemDiv.querySelector('#item_url_' + itemId)
    if (itemData.url && linkTitle) {
        linkTitle.onclick = function() {
            // when they click this, log their interest
            firebaseData.logUserActivity('clicked', itemId, itemData);
            // and send them there
            var targetLink = document.createElement('a');
            // going to a new tab
            targetLink.target= "_blank";
            targetLink.href = itemData.url;
            targetLink.click();
        }
        linkTitle.href = '#';
        linkTitle.innerHTML = "external link";
        linkTitle.style.display = null;
    }
    else if (linkTitle) {
        linkTitle.style.display = "none";
    }

    setContainerData(itemDiv, 'item', 'physical', itemId, itemData);
    setContainerData(itemDiv, 'item', 'colours', itemId, itemData);
    setContainerData(itemDiv, 'item', 'supplier', itemId, itemData);

    // setup the table correctly
    var table = itemDiv.querySelector('#quantity_data_table');
    table.id = "prices_table_" + itemId;
    var showButton = itemDiv.querySelector('#quantity_button');
    showButton.id = "prices_button_" + itemId;
    showButton.onclick = function() {
        if (!table.style.display) {
            table.style.display = 'none';
            showButton.innerHTML = 'Show Prices...'
        }
        else {
            table.style.display = null;
            showButton.innerHTML = 'Hide Prices...'
            // log this activity if valid to do so
            firebaseData.logUserActivity('priced', itemId, itemData);
        }
    }
    resultContainer.insertBefore(itemDiv, separator);

    // we will also want to show all the quantities under this item
    firebaseData.getQuantitiesInItem(itemId,
        function(querySnapshot) {
            // have all the items here, add them all to the category
            querySnapshot.forEach(function(doc) {
                // for each doc (item) add the data
                onQuantityFound(table, doc.id, doc.data());
            })
        },
        function(error) {
            console.log('failed to find the quantities in an item', error);
        });
}

function onQuantityFound(table, quantityId, quantityData, isHideGbp, isHideUsd, isHideAud, isHideNotes) {
    // add a row to the table
    var newRow = document.createElement('tr');
    newRow.id = quantityId;
    var tBody = table.getElementsByTagName('tbody')[0];
    // add the data to this row
    addTableCell(newRow, quantityData.quantity);
    if (!isHideGbp) {
        addTableCell(newRow, quantityData.gbp_notes ? quantityData.gbp_notes : '£' + quantityData.gbp);
    }
    if (!isHideUsd) {
        addTableCell(newRow, quantityData.usd_notes ? quantityData.usd_notes : '$' + quantityData.usd);
    }
    if (!isHideAud) {
        addTableCell(newRow, quantityData.aud_notes ? quantityData.aud_notes : 'A$' + quantityData.aud);
    }
    if (!isHideNotes) {
        addTableCell(newRow, quantityData.notes ? quantityData.notes : '');
    }
    // and put the row into the table
    tBody.appendChild(newRow);
}

function addTableCell(row, cellData) {
    var dataElement = document.createElement('td');
    dataElement.innerHTML = cellData;
    row.appendChild(dataElement);
}

function setContainerData(parent, level, variable, id, data) {
    var divElement = parent.querySelector('#' + level + "_" + variable);
    divElement.id = level + '_' + variable + '_' + id;
    if (data) {
        // there is data, do something with it
        if (data[variable]) {
            divElement.innerHTML = data[variable];
        }
        else {
            divElement.innerHTML = '';
        }
    }
    return divElement;
}

function onSubmitSearch() {
    // search the selected categories for matches, find all the categories to show from those matched
    var categoryContainer = document.getElementById('found_categories');
    var resultContainer = document.getElementById('search_results_container');
    var noneContainer = document.getElementById('search_results_none');
    var searchTerm = document.getElementById('search').value;
    // clear all the old data
    resultContainer.innerHTML = "";
    document.getElementById('search_results_none_container').style.display = null;
    categoryContainer.innerHTML = "";
    categoriesFound = [];

    if (document.getElementById('search_categories').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionCategories, 'name', searchTerm,
            function(querySnapshot) {
                noneContainer.style.display = (querySnapshot.size == 0 ? null : 'none');
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of these found documents in the HTML
                    onCategoryFound(categoryContainer, resultContainer, doc.id, doc.data())
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
                noneContainer.style.display = null;
            });
    }
    if (document.getElementById('search_items').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionItems, 'category_name', searchTerm,
            function(querySnapshot) {
                noneContainer.style.display = (querySnapshot.size == 0 ? null : 'none');
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of the categories of the item in the HTML
                    loadCategoryData(doc.data().category_ref);
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
                noneContainer.style.display = null;
            });
    }
    if (document.getElementById('search_quantities').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionQuantities, 'category_name', searchTerm,
            function(querySnapshot) {
                noneContainer.style.display = (querySnapshot.size == 0 ? null : 'none');
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of the categories of the item in the HTML
                    loadCategoryData(doc.data().category_ref);
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
                noneContainer.style.display = null;
            });
    }
}

function loadCategoryData(categoryRef) {
    var categoryContainer = document.getElementById('found_categories');
    var resultContainer = document.getElementById('search_results_container');
    firebaseData.getCategoryById(categoryRef.id, 
        function(doc) {
            // got it
            onCategoryFound(categoryContainer, resultContainer, doc.id, doc.data())
        },
        function(error) {
            // failed
            console.log('category not found: ', error);
        });
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');

    const node = document.getElementById("search");
    if (node) {
        node.addEventListener("keyup", function(event) {
            if (event.key === "Enter") {
                onSubmitSearch();
            }
        });
        checkUserState();
    }
});