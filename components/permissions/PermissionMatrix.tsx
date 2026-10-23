import type { ReactNode } from 'react';
import type { Permission } from '@/lib/services/permissions';

const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'APPROVE'] as const;

export function permissionAction(permission: Permission): string | null {
  const parts = permission.permissionCode.split('_');
  return parts.length === 2 && ACTIONS.some((action) => action === parts[1]) &&
    permission.module !== 'DASHBOARD' ? parts[1] : null;
}

interface Props {
  permissions: Permission[];
  renderPermission: (permission: Permission) => ReactNode;
  effectivePermissions: string[];
}

export default function PermissionMatrix({ permissions, renderPermission, effectivePermissions }: Props) {
  const modules = [...new Set(permissions.map((permission) => permission.module))].sort();
  const other = permissions.filter((permission) => !permissionAction(permission));
  const names = new Map(permissions.map((permission) => [permission.permissionCode, permission.displayName]));

  const renderCheckboxes = (permission: Permission) => (
    <div className="pm-checkbox-cell" key={permission.permissionCode}
      title={`${permission.displayName} (${permission.permissionCode})`}
      role="group" aria-label={permission.displayName}>
      {renderPermission(permission)}
    </div>
  );

  return (
    <>
      <section className="pm-access-summary" aria-label="Effective access summary">
        <strong>{effectivePermissions.length} of {permissions.length} permissions currently granted</strong>
        <p>Rows are modules. Select permissions under View, Create, Edit or Approve.</p>
      </section>
      <div className="pm-table-scroll">
        <table className="pm-matrix">
          <caption>Permission access by module and action</caption>
          <colgroup>
            <col className="pm-module-column" />
            {ACTIONS.map((action) => <col key={action} />)}
          </colgroup>
          <thead><tr>
            <th scope="col">Module</th>
            {ACTIONS.map((action) =>
              <th scope="col" key={action}>{action[0] + action.slice(1).toLowerCase()}</th>
            )}
          </tr></thead>
          <tbody>
            {modules.map((module) => {
              const entries = permissions.filter((permission) =>
                permission.module === module && permissionAction(permission)
              );
              if (!entries.length) return null;
              return <tr key={module}>
                <th scope="row">
                  <strong>{module}</strong>
                </th>
                {ACTIONS.map((action) => {
                  const cellPermissions = entries.filter((permission) => permissionAction(permission) === action);
                  return <td key={action}>
                    {cellPermissions.length ?
                      <div className="pm-cell-list">{cellPermissions.map(renderCheckboxes)}</div> :
                      <span className="pm-sr-only">Not applicable</span>}
                  </td>;
                })}
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {other.length > 0 && <section className="pm-other-section">
        <h3>Other permissions</h3>
        <div className="pm-table-scroll pm-other-scroll">
          <table className="pm-matrix pm-other-matrix">
            <caption className="pm-sr-only">Other permissions by module</caption>
            <colgroup>
              <col className="pm-module-column" />
              <col />
              <col className="pm-access-column" />
            </colgroup>
            <thead><tr>
              <th scope="col">Module</th>
              <th scope="col">Permission</th>
              <th scope="col">Access</th>
            </tr></thead>
            <tbody>
              {modules.flatMap((module) => {
                const entries = other.filter((permission) => permission.module === module);
                return entries.map((permission, index) => <tr key={permission.permissionCode}>
                  {index === 0 && <th scope="rowgroup" rowSpan={entries.length}><strong>{module}</strong></th>}
                  <td className="pm-permission-name" title={permission.permissionCode}>{permission.displayName}</td>
                  <td>{renderCheckboxes(permission)}</td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </section>}
      <section className="pm-section">
        <h3>Currently granted permissions ({effectivePermissions.length})</h3>
        <div className="pm-chips">{effectivePermissions.map((code) =>
          <span className="pm-badge" key={code} title={code}>{names.get(code) ?? code}</span>
        )}{!effectivePermissions.length && <span className="pm-muted">No permissions are currently granted.</span>}</div>
      </section>
    </>
  );
}
