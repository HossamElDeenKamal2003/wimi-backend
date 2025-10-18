// src/shared/response.js
class Response {
    static success(res, data, message = 'Success', status = 200) {
        return res.status(status).json({ success: true, message, data });
    }

    static badRequest(res, message = 'Bad Request') {
        return res.status(400).json({ success: false, message });
    }

    static unauthorized(res, message = 'Unauthorized') {
        return res.status(401).json({ success: false, message });
    }

    static notFound(res, message = 'Not Found') {
        return res.status(404).json({ success: false, message });
    }

    static serverError(res, message = 'Internal Server Error') {
        return res.status(500).json({ success: false, message });
    }

    static conflict(res, message = 'Conflict') {
        return res.status(409).json({ success: false, message });
    }
}

module.exports = Response;