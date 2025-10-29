export interface JwtPayload {
    id: number;
    email: string;
    iat: number;
    exp: number;
    iss?: string;
    aud?: string;
}
