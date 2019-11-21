*** Settings ***

Resource        robot/Cumulus/resources/NPSP.robot
Library         cumulusci.robotframework.PageObjects
...             robot/Cumulus/resources/ContactPageObject.py
Suite Setup     Open Test Browser
Suite Teardown  Delete Records and Close Browser

*** Test Cases ***

Create Household With Name Only
    ${first_name} =           Generate Random String
    ${last_name} =            Generate Random String
    Go To Page                Listing     Contact
    Click Object Button       New
    Populate Form
    ...                       First Name=${first_name}
    ...                       Last Name=${last_name}
    Save Form
   # Verify Toast Message      Contact "${first_name} ${last_name}" was created
    ${contact_id} =           Get Current Record Id
    Store Session Record      Contact  ${contact_id}
    &{contact} =              Salesforce Get  Contact  ${contact_id}
    Should Not Be Empty       ${contact}      
    Header Field Value        Account Name    &{contact}[LastName] Household
    Go To Object Home         Contact
    Verify Record             &{contact}[FirstName] &{contact}[LastName]

    
Create Household With Name and Email
    [tags]  unstable
    ${first_name} =           Generate Random String
    ${last_name} =            Generate Random String
    Go To Page                Listing     Contact
    Click Object Button       New
    Populate Form
    ...                       First Name=${first_name}
    ...                       Last Name=${last_name}
    ...                       Work Email= skristem@salesforce.com
    Click Modal Button        Save & New
   # Wait Until Modal Is Closed
    ${contact_id} =           Get Current Record Id
    Store Session Record      Contact  ${contact_id}
    &{contact} =  Salesforce Get  Contact  ${contact_id}
    Should Not Be Empty       ${contact}
    Header Field Value    Account Name    &{contact}[LastName] Household
    Header Field Value    Email    skristem@salesforce.com
    Go To Page                Listing     Contact
    Verify Record    &{contact}[FirstName] &{contact}[LastName]

    
Create Household with Name and Address
    ${contact_id} =  Create Contact with Address
    &{contact} =  Salesforce Get  Contact  ${contact_id}
    Header Field Value    Account Name    &{contact}[LastName] Household
    Page Should Contain    50 Fremont Street  
    Go To Object Home         Contact
    Verify Record    &{contact}[FirstName] &{contact}[LastName]
