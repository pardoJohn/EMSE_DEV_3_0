{
  "EnvHealth/Personal Services/*/Application": {
    "ApplicationSubmitAfter": [
      {
        "metadata": {
          "description": "To automate creation and updating of reference contacts for Individuals on ASA for back office users",
          "operators": {}
        },
        "criteria": {
          "publicUser": false
        },
        "preScript": "",
        "action": {
          "contactTypes": [
            "Applicant",
            "Accounts Receivable",
            "Manager",
            "Facility Owner"
          ],
          "createReferenceContacts": true,
          "updateReferenceContacts": true,
          "compareFunction": "comparePeopleMatchCriteria",
          "referenceContactType": "Individual"
        },
        "postScript": ""
      }
    ],
    "ConvertToRealCAPAfter": [
      {
        "metadata": {
          "description": "To automate creation and updating of Individual reference contacts on CTRCA for Public Users",
          "operators": {}
        },
        "criteria": {},
        "preScript": "",
        "action": {
          "contactTypes": [
            "Applicant",
            "Accounts Receivable",
            "Manager",
            "Facility Owner"
          ],
          "createReferenceContacts": true,
          "updateReferenceContacts": true,
          "compareFunction": "comparePeopleMatchCriteria",
          "referenceContactType": "Individual",
          "createPublicUser": true
        },
        "postScript": ""
      }
    ]
  }
}