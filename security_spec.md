# Security Specification: Twenty-Seven Building OS

## 1. Data Invariants
1. **User Identity & Role Integrity**:
   - Only authenticated users can access the system.
   - Users cannot arbitrarily assign themselves a `manager` role if one does not exist for their email.
   - Bootstrapped admin email: `cappuchino.MP@gmail.com` is granted `manager` role.
   - Only a user with the `manager` role can update another user's `role`.
   - Users can read their own profile; managers can read all user profiles.
2. **Incident Tickets**:
   - `reportedByUid` must match `request.auth.uid`.
   - `incidentNumber` is required and limited in length.
   - `reception` and `manager` can create incident tickets.
   - `technician` can update status and assignment.
   - Deletion of incidents is restricted to `manager`.
3. **Preventive Maintenance (PM)**:
   - Readable by authenticated staff (`manager`, `technician`).
   - Creatable and updatable by `manager` and `technician`.
4. **Inventory Items**:
   - Readable and editable by `manager` and `technician`.
5. **Expenses & History**:
   - Readable and manageable by `manager`. Technicians can view if assigned.
6. **Input Bounds & Type Guards**:
   - All string fields have strict `.size()` constraints.
   - No arbitrary extra fields allowed on creation or updates.

## 2. The "Dirty Dozen" Payloads (Adversarial Test Vectors)
1. **Payload 1 (Self-Escalation Attack)**: Non-admin user sets `role: "manager"` upon registration.
2. **Payload 2 (Ghost Field Injection)**: Creating an incident with `{ secretBackdoor: true }`.
3. **Payload 3 (Impersonated Reporter)**: User sets `reportedByUid: "victim_user_123"` instead of `request.auth.uid`.
4. **Payload 4 (Buffer Overflow / Denial of Wallet)**: Injecting 2MB string in `description`.
5. **Payload 5 (Unauthenticated Read)**: Anonymous request querying `/incidents` or `/users`.
6. **Payload 6 (Terminal State Bypass)**: Reopening a locked/cancelled incident without proper manager authority.
7. **Payload 7 (Negative Expense Amount)**: Injecting negative currency amount `{ amount: -9999999 }` in expenses.
8. **Payload 8 (Inventory Poisoning)**: Setting negative quantity `{ quantity: -50 }`.
9. **Payload 9 (Cross-User Profile Hijack)**: User updating `/users/{otherUid}` without manager privilege.
10. **Payload 10 (Delete Operation by Reception)**: Reception role attempting `delete` on an incident record.
11. **Payload 11 (Unverified Email Write)**: Write attempted with unverified email token.
12. **Payload 12 (Direct Field Alteration of Immutable Keys)**: Modifying `createdAt` or `reportedByUid` on an existing incident.

## 3. Test Runner Invariant
All 12 malicious payloads must be rejected by Firestore Security Rules with `PERMISSION_DENIED`.
