export interface EmailData {
    subject: string;
    body: string;
    receivedDateTime: string;
}

export interface MessageResponse {
    id: string;
    subject: string;
    body: {
        content: string;
    };
    receivedDateTime: string;
}

export interface UserResponse {
    id: string;
    displayName: string;
    userPrincipalName: string;
    mail: string;
}