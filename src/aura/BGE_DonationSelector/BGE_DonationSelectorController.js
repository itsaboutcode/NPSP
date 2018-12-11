({
    /**
     * @description: handles selected donation option to select a payment or opportunity
     */
    handleDonationSelection: function(component, event, helper) {
        const selectedDonation = event.getSource().get('v.value');
        helper.processDonationSelection(component, selectedDonation);
    },
    /**
     * @description: handles new opportunity option to create a new opportunity
     */
    handleNewOppDonationSelection: function(component, event, helper) {
        const selectedDonation = '';
        helper.processDonationSelection(component, selectedDonation);
    },

})