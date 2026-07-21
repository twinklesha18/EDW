export const policies = Object.freeze({
  faq: {
    title: 'Frequently Asked Questions',
    eyebrow: 'FAQ',
    description: 'Editable answers for common questions. Business-specific details must be confirmed before launch.',
    sections: [
      { title: 'How do custom orders work?', body: 'Share your occasion, budget, colors and idea through the custom order form. The business owner should confirm the final consultation and approval process.' },
      { title: 'How early should I place an order?', body: 'Lead times have not been finalized. Add the minimum notice required for standard and complex custom orders before publishing.' },
      { title: 'Can I select my own colors and message?', body: 'The catalogue is designed around customization. Confirm any material or color limitations with the customer before accepting the order.' },
      { title: 'Where do you deliver?', body: 'Delivery areas and collection options must be confirmed by the business owner.' },
    ],
  },
  shipping: {
    title: 'Shipping Information', eyebrow: 'Customer Care', description: 'A transparent shipping guide ready for confirmed business details.',
    sections: [
      { title: 'Delivery Areas', body: 'Owner action required: list the cities, districts or regions currently served.' },
      { title: 'Delivery Timeframes', body: 'Owner action required: add estimated preparation and delivery windows for standard and custom creations.' },
      { title: 'Delivery Charges', body: 'Owner action required: explain how charges are calculated and when the customer receives a final quote.' },
      { title: 'Care During Delivery', body: 'Describe the packing and handling process after it has been finalized operationally.' },
    ],
  },
  returns: {
    title: 'Return Policy', eyebrow: 'Customer Care', description: 'Editable guidance only. Final return and cancellation terms require owner confirmation.',
    sections: [
      { title: 'Customized Items', body: 'Owner action required: define whether personalized products can be returned, changed or cancelled.' },
      { title: 'Damaged Orders', body: 'Owner action required: define the reporting window, evidence needed and available remedies.' },
      { title: 'Order Changes', body: 'Owner action required: state how soon customers must request design or delivery changes.' },
      { title: 'Refund Processing', body: 'Owner action required: confirm eligibility, method and expected processing time.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy', eyebrow: 'Legal Placeholder', description: 'This page must be reviewed and completed before personal information is collected.',
    sections: [
      { title: 'Information Collected', body: 'Owner action required: list contact, order, payment and website usage information the business will collect.' },
      { title: 'How Information Is Used', body: 'Owner action required: document order fulfilment, communication, support and lawful marketing uses.' },
      { title: 'Storage and Security', body: 'Owner action required: document service providers, retention periods and safeguards after the backend architecture is finalized.' },
      { title: 'Customer Choices', body: 'Owner action required: explain access, correction, deletion and communication preference procedures.' },
    ],
  },
  terms: {
    title: 'Terms and Conditions', eyebrow: 'Legal Placeholder', description: 'Editable terms framework that requires business and legal confirmation before launch.',
    sections: [
      { title: 'Orders and Acceptance', body: 'Owner action required: define when a request becomes an accepted order and what confirmation is provided.' },
      { title: 'Pricing and Payment', body: 'Owner action required: document currencies, deposits, accepted payment methods and price-change handling.' },
      { title: 'Customization Approval', body: 'Owner action required: define proof approval, reasonable substitutions and customer response timeframes.' },
      { title: 'Liability and Contact', body: 'Owner action required: obtain appropriate legal guidance and add the official business contact details.' },
    ],
  },
})
