export interface EmailData {
    subject: string;
    content: {
        plainText: string;    // Treść bez HTML
        links: Array<{       // Wyekstrahowane linki
            text: string;
            url: string;
        }>;
        attachments: Array<{ // Załączniki
            name: string;
            url: string;
        }>;
    };
    metadata: {
        from: string;
        to: string;
        cc?: string[];
        receivedDateTime: string;
        forwardChain?: Array<{  // Historia przekazywania
            from: string;
            to: string;
            date: string;
        }>;
    };
}

export interface MessageResponse {
    id: string;
    subject: string;
    body: {
        content: string;
    };
    from: {
        emailAddress: {
            name: string;
            address: string;
        };
    };
    toRecipients: Array<{
        emailAddress: {
            name: string;
            address: string;
        };
    }>;
    ccRecipients?: Array<{
        emailAddress: {
            name: string;
            address: string;
        };
    }>;
    receivedDateTime: string;
}

export interface UserResponse {
    id: string;
    displayName: string;
    userPrincipalName: string;
    mail: string;
}