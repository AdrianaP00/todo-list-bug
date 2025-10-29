export const jwtConstants = {
    secret:
        process.env.JWT_SECRET ||
        (() => {
            console.warn(
                '⚠️  WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!',
            );
            return '5fcf1a4df6b57926bfcc01af34f259fa';
        })(),
};
