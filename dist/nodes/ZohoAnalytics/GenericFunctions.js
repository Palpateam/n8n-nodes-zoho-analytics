"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zohoApiRequest = zohoApiRequest;
exports.getOrganisations = getOrganisations;
exports.getWorkspaces = getWorkspaces;
exports.getViews = getViews;
exports.getColumns = getColumns;
async function zohoApiRequest(method, endpoint, qs = {}, body = {}, orgId, isFormData = false) {
    const credentials = await this.getCredentials('zohoAnalyticsOAuth2Api');
    // Construct API domain directly from environment to be more robust during automated runs
    const environment = credentials.environment || 'eu';
    const apiDomain = `https://analyticsapi.zoho.${environment}`;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const headers = {};
    if (orgId) {
        headers['ZANALYTICS-ORGID'] = String(orgId).trim();
    }
    if (isFormData) {
        // Manually construct multipart/form-data body
        // This is required because n8n's httpRequestWithAuthentication uses axios,
        // and passing a plain object as formData doesn't produce valid multipart encoding.
        const boundary = '----n8nZohoFormBoundary' + Date.now().toString(36);
        let multipartBody = '';
        for (const key of Object.keys(body)) {
            multipartBody += `--${boundary}\r\n`;
            multipartBody += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
            multipartBody += body[key] + '\r\n';
        }
        multipartBody += `--${boundary}--\r\n`;
        headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
        const options = {
            method,
            qs,
            url: `${apiDomain}${path}`,
            body: Buffer.from(multipartBody),
            headers,
            encoding: null,
            json: false,
        };
        try {
            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'zohoAnalyticsOAuth2Api', options);
            if (typeof response === 'string') {
                return JSON.parse(response);
            }
            return response;
        }
        catch (error) {
            throw error;
        }
    }
    else {
        const options = {
            method,
            qs,
            url: `${apiDomain}${path}`,
            body,
            headers,
            json: true,
        };
        try {
            return await this.helpers.httpRequestWithAuthentication.call(this, 'zohoAnalyticsOAuth2Api', options);
        }
        catch (error) {
            throw error;
        }
    }
}
async function getOrganisations() {
    var _a;
    const response = await zohoApiRequest.call(this, 'GET', '/restapi/v2/orgs');
    const orgs = ((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.orgs) || [];
    return orgs.map((org) => ({ name: org.orgName, value: org.orgId }));
}
async function getWorkspaces() {
    var _a, _b;
    const response = await zohoApiRequest.call(this, 'GET', '/restapi/v2/workspaces');
    const owned = ((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.ownedWorkspaces) || [];
    const shared = ((_b = response === null || response === void 0 ? void 0 : response.data) === null || _b === void 0 ? void 0 : _b.sharedWorkspaces) || [];
    const workspaces = [...owned, ...shared];
    return workspaces.map((ws) => ({ name: ws.workspaceName, value: ws.workspaceId }));
}
async function getViews() {
    var _a;
    const workspaceIDRaw = this.getNodeParameter('workspace', '') || '';
    const workspaceID = String(workspaceIDRaw).trim();
    if (!workspaceID)
        return [];
    const organisationIDRaw = this.getNodeParameter('organisation', '') || '';
    const organisationID = String(organisationIDRaw).trim();
    const response = await zohoApiRequest.call(this, 'GET', `/restapi/v2/workspaces/${encodeURIComponent(workspaceID)}/views`, {}, {}, organisationID);
    const views = ((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.views) || [];
    return views
        .filter((v) => v.viewType === 'Table')
        .map((view) => ({ name: view.viewName, value: view.viewId }));
}
async function getColumns() {
    var _a, _b;
    const viewIDRaw = this.getNodeParameter('view', '') || '';
    const viewID = String(viewIDRaw).trim();
    if (!viewID)
        return [];
    const organisationIDRaw = this.getNodeParameter('organisation', '') || '';
    const organisationID = String(organisationIDRaw).trim();
    const qs = { CONFIG: JSON.stringify({ withInvolvedMetaInfo: true }) };
    const response = await zohoApiRequest.call(this, 'GET', `/restapi/v2/views/${encodeURIComponent(viewID)}`, qs, {}, organisationID);
    const columns = ((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.views) === null || _b === void 0 ? void 0 : _b.columns) || [];
    return columns.map((col) => ({ name: col.columnName, value: col.columnName }));
}
//# sourceMappingURL=GenericFunctions.js.map