async function getInstallationRecordsById(data) {
    try {
        const getRecordById = await ZOHO.CRM.API.getRecord({ Entity: "SI", RecordID: data.EntityId[0] })

        // getting data here
        installationRecordData = getRecordById.data && getRecordById.data.length > 0 && getRecordById.data[0];

        console.log("getInstallationRecordsById --> ", data, getRecordById);
        // console.log("getCustomerById -->  ", getRecordById.data[0].Service_Item, getCustomerRecordById)
        // console.log("getProductRecordById --> ", getRecordById.data[0].Product, getProductRecordById)

        // ? moved to index.js
        // if (getRecordById.data && getRecordById.data.length > 0 && getRecordById.data[0].Service_Item && getRecordById.data[0].Service_Item?.id && getRecordById.data[0].Service_Item?.module) {
        //     getCustomerById(getRecordById.data[0].Service_Item)
        // } else {
        //     console.warn("Service_Item was not found");
        // }
        // if (installationRecordData?.Service_Item && installationRecordData?.Service_Item?.id && installationRecordData?.Service_Item?.module) {
        //     getCustomerById(installationRecordData?.Service_Item)
        // } else {
        //     console.warn("Service_Item was not found");
        // }

        // if (getRecordById.data && getRecordById.data.length > 0 && getRecordById.data[0].Product && getRecordById.data[0].Product?.id && getRecordById.data[0].Product?.module) {
        //     getProductById(getRecordById.data[0].Product)
        // } else {
        //     console.warn("Product was not found");
        // }
        // if (installationRecordData?.Product && installationRecordData?.Product?.id && installationRecordData?.Product?.module) {
        //     getProductById(installationRecordData?.Product)
        // } else {
        //     console.warn("Product was not found");
        // }

        // Check if the new value already exists in the select options
        // for HQ name
        // if ($('#hq_name_input option[value="' + installationRecordData?.HQ_Name + '"]').length == 0) {
        //     // If it doesn't exist, add it as a new option
        //     $('#hq_name_input').append('<option value="' + installationRecordData?.HQ_Name + '">' + installationRecordData?.HQ_Name + '</option>');
        // }
        // for serial no
        if ($('#serial_no_input option[value="' + installationRecordData?.Name + '"]').length == 0) {
            // If it doesn't exist, add it as a new option
            $('#serial_no_input').append('<option selected value="' + installationRecordData?.Name + '">' + installationRecordData?.Name + '</option>');
        }
        // for serial no
        // if ($('#service_item_number_input option[value="' + installationRecordData?.Serial_No + '"]').length == 0) {
        //     // If it doesn't exist, add it as a new option
        //     $('#service_item_number_input').append('<option value="' + installationRecordData?.Serial_No + '">' + installationRecordData?.Serial_No + '</option>');
        // }
        // for service item owner
        if ($('#service_item_owner_input option[value="' + installationRecordData?.Owner?.name + '"]').length == 0) {
            // If it doesn't exist, add it as a new option
            $('#service_item_owner_input').append('<option value="' + installationRecordData?.Owner?.name + '">' + installationRecordData?.Owner?.name + '</option>');
        }

        // Set the value of the select input
        // $('#hq_name_input').val(installationRecordData?.HQ_Name);
        $('#serial_no_input').val(installationRecordData?.Name);
        // $('#service_item_number_input').val(installationRecordData?.Serial_No);
        $('#service_item_owner_input').val(installationRecordData?.Owner?.name);

        // setting input values
        // $('#installation_id_input').val(installationRecordData?.Installation_ID);
        $('#warranty_type_input').val(installationRecordData?.Warranty_Type);
        $('#status_input').val(installationRecordData?.Status);
        // ! change for end date
        $('#previous_contract_end_date_input').val(installationRecordData?.Final_Contract_End_Date);
        // $('#previous_contract_end_date_input').val(installationRecordData?.Warranty_End_Date1);
        $('#installation_date_input').val(installationRecordData?.Installation_Date1);

        // setting min date for AMC start Date
        // ! change for end date
        $('#amc_start_date_input').attr('min', installationRecordData?.Final_Contract_End_Date);

        // ! change for end date
        let selectedDate = new Date(installationRecordData?.Final_Contract_End_Date);
        // let selectedDate = new Date(installationRecordData?.Warranty_End_Date1);
        selectedDate.setFullYear(selectedDate.getFullYear() + 1)
        let formattedDate = formatDate(selectedDate);
        $('#amc_end_date_input').attr('min', formattedDate);

        // checking installing date with current year
        // console.log(installationRecordData?.Installation_Date1, new Date(installationRecordData?.Installation_Date1).getFullYear(), new Date().getFullYear())

        setTimeout(() => {
            $("#loaderDiv").css("display", "none");
            $("#body").css("display", "flex");
        })
        return getRecordById.data && getRecordById.data.length > 0 && getRecordById.data[0];
    } catch (error) {
        console.log("Internal error when getting getInstallationRecordsById --> ", error)
    }
}

async function getCustomerById(data) {
    try {
        const getCustomerRecordById = await ZOHO.CRM.API.getRecord({ Entity: data?.module || "Accounts", RecordID: data?.id });
        console.log("getCustomerById -->  ", data, getCustomerRecordById)

        customerData = getCustomerRecordById.data && getCustomerRecordById.data.length > 0 && getCustomerRecordById.data[0];

        // Check if the new value already exists in the select options
        // for customer name
        if ($('#installed_customer_name_input option[value="' + customerData?.id + '"]').length == 0) {
            // If it doesn't exist, add it as a new option
            $('#installed_customer_name_input').append('<option value="' + customerData?.id + '">' + customerData?.Account_Name + '</option>');
        }
        // for customer code
        if ($('#installed_customer_code_input option[value="' + customerData?.Customer_Code + '"]').length == 0) {
            // If it doesn't exist, add it as a new option
            $('#installed_customer_code_input').append('<option value="' + customerData?.Customer_Code + '">' + customerData?.Customer_Code + '</option>');
        }
        // for HQ name
        if (customerData?.HQ && customerData?.HQ?.name && customerData?.HQ?.id) {
            if ($('#hq_name_input option[value="' + customerData?.HQ?.id + '"]').length == 0) {
                // If it doesn't exist, add it as a new option
                $('#hq_name_input').append('<option value="' + customerData?.HQ?.id + '">' + customerData?.HQ?.name + '</option>');
            }
        }

        // Set the value of the select input
        $('#installed_customer_name_input').val(customerData?.id);
        $('#installed_customer_code_input').val(customerData?.Customer_Code);
        $('#hq_name_input').val(customerData?.HQ?.id);

        // for removing initial loader after data is loaded
        $("#loaderDiv").css("display", "none");
        $("#body").css("display", "inherit");
    } catch (error) {
        console.log("Internal error when getting getCustomerById --> ", error)
    }
}

async function getProductById(data) {
    try {
        const getProductRecordById = await ZOHO.CRM.API.getRecord({ Entity: data?.module || "Products", RecordID: data?.id });

        productData = getProductRecordById.data && getProductRecordById.data.length > 0 && getProductRecordById.data[0];
        console.log("getProductRecordById --> ", data, getProductRecordById)

        // Check if the new value already exists in the select options
        // for product name lookup
        if ($('#product_name_lookup_input option[value="' + productData?.id + '"]').length === 0) {
            // If it doesn't exist, add it as a new option
            $('#product_name_lookup_input').append('<option value="' + productData?.id + '">' + productData?.Product_Name + '</option>');
        }

        // Set the value of the select input
        $('#product_name_lookup_input').val(productData?.id);


    } catch (error) {
        console.log("Internal error when getting getProductById --> ", error)
    }
}

async function getProductAging(params) {
    try {
        // "parameters": {
        //     "Trigger": ["workflow", "blueprint"],
        //     "data": [
        //         {
        //             "Owner": currentUser?.id,
        //             "Modified_By": currentUser?.id,
        //             "Created_By": currentUser?.id,
        //             "Type": data['type_input'],
        //             "Installation_Date": data['installation_date_input'],
        //             "Installed_Customer_Code": data['installed_customer_code_input'],
        //             "Installed_Customer_Name": data['installed_customer_name_input'],
        //             "Customer_Code": customerData['Customer_Code'],
        //             "Customer_Name": customerData['id'],
        //             "Installation_ID": installationRecordData['Installation_ID'],
        //             "Quote_Name": `${customerData?.Account_Name} Quotes`,
        //             "Product_Name": data['product_name_lookup_input'],
        //             "Product_Code": productData['Product_Code'],
        //             "Previous_Contract_End_Date": data['previous_contract_end_date_input'],
        //             "Serial_No": data['serial_no_input'],
        //             "Service_Item_Number": installationRecordData['Serial_No'],
        //             "HQ_Name": data['hq_name_input'],
        //             "Warranty_Type": data['warranty_type_input'],
        //             // "Percentage": parseFloat((+$('#totalQuotingPrice').text() / +$('#totalAmount').text()).toFixed(2)),
        //             "Owner_Division": ownerData?.Division,
        //             "Owner_HQ": ownerData?.HQ?.id,
        //             "Owner_Region": ownerData?.Region,
        //             "Owner_Role": ownerData?.Role,
        //             "Owner_Zone": ownerData?.Zone,
        //             "Approval_Status": "Quote Submitted",
        //             "Percentage": parseFloat(greatestPercentage?.Percentage).toFixed(2),
        //             "Spare_Parts_Information": spareData
        //         }
        //     ]
        // },

        var req_data = {
            "parameters": {
                "fields": "Year_2,Year_3,Year_4,Year_5,Year_6,Year_7,Year_8,Year_9,Year_10,Type_of_Contract,Product_Name",
            },
            "method": "GET",
            "url": `https://www.zohoapis.in/crm/v6/Product_Ageing/search?criteria=((Type_of_Contract:starts_with:${params.type_Of_Contract})and(Product_Name.id:equals:${params?.id}))`,
            "param_type": 1
        };

        const productAgeingInvokeResult = await ZOHO.CRM.CONNECTION.invoke("widget_connection", req_data);

        if (productAgeingInvokeResult && productAgeingInvokeResult?.details && productAgeingInvokeResult?.details?.statusMessage && productAgeingInvokeResult?.details?.statusMessage?.data && productAgeingInvokeResult?.details?.statusMessage?.data.length > 0) {
            console.log("getProductAging", params, productAgeingInvokeResult?.details);
            productAgeing = productAgeingInvokeResult?.details?.statusMessage?.data[0]
        } else {
            console.log("getProductAging no data -> ", productAgeingInvokeResult);
            // No data found, show the modal
            $('#noDataModal').modal('show');
            $('#type_input').val('');
            $('#based_on_type').addClass('d-none');
            $('#spare_type').addClass('d-none');
        }


        // ! Due to permission issue not using the below method
        // let config = {
        //     "select_query": "select Year_2, Year_3, Year_4, Year_5, Year_6, Year_7, Year_8, Year_9, Year_10, Type_of_Contract, Product_Name from Product_Ageing where Product_Name.id = " + params?.id + " and Type_of_Contract = " + params.type_Of_Contract + " order by id desc limit 20",
        // };

        // ZOHO.CRM.API.coql(config).then(function (data) {
        //     console.log("getProductAging", params, data);
        //     if (data && data?.data && data?.data.length > 0) {
        //         productAgeing = data?.data[0]
        //     } else {
        //         console.log("getProductAging no data -> ", data);
        //         // No data found, show the modal
        //         $('#noDataModal').modal('show');
        //         $('#type_input').val('');
        //         $('#based_on_type').addClass('d-none');
        //         $('#spare_type').addClass('d-none');
        //     }
        // })

    } catch (error) {
        console.log("Internal error when getting getProductAging --> ", error)
    }
}

async function getOwnerInfo(data, owner_info) {
    try {


        const searchResultEmail = await ZOHO.CRM.API.searchRecord({ Entity: "Employee_Master", Type: "email", Query: owner_info?.email });
        // console.log("owner_info", owner_info, owner_info?.email, searchResultEmail)

        if (searchResultEmail?.data && searchResultEmail?.data.length > 0) {
            ownerData = searchResultEmail?.data[0];
            console.log("getOwnerInfo", owner_info, ownerData, ownerData?.Division, ownerData?.Region, ownerData?.Role, ownerData?.Zone, ownerData?.HQ?.id);
        } else {
            console.log("getOwnerInfo no data ->| ", owner_info, searchResultEmail);
        }

        // ! wasn't getting proper data from below api, so used email in above one. 
        // const searchCriteria = "(Name:equals:" + data + ")";
        // const searchResult = await ZOHO.CRM.API.searchRecord({
        //     Entity: "Employee_Master",
        //     Type: "criteria",
        //     Query: searchCriteria
        // });
        // if (searchResult?.data && searchResult?.data.length > 0) {
        //     ownerData = searchResult?.data[0];
        //     console.log("getOwnerInfo", data, ownerData, ownerData?.Division, ownerData?.Region, ownerData?.Role, ownerData?.Zone, ownerData?.HQ?.id);
        // } else {
        //     console.log("getOwnerInfo no data ->| ", data, searchResult);
        // }
    } catch (error) {
        console.log('Error in getOwnerInfo - ', error)
    }
}