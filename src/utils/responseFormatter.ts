export const formatCopilotResponse = (message: string, data?: any) => {
    return {
        message,
        timestamp: new Date().toISOString(),
        data: data || [],
    };
};
