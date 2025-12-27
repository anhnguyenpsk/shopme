
const BASE_URL = 'http://localhost:3000/api/admin/categories';

async function runVerification() {
    console.log('Starting verification...');

    try {
        // 1. Create Parent
        console.log('Creating Parent Category...');
        const parentRes = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Parent ' + Date.now() })
        });

        if (!parentRes.ok) {
            const text = await parentRes.text();
            throw new Error(`Parent Create Failed: ${parentRes.status} ${text}`);
        }

        const parentData = await parentRes.json();
        const parentId = parentData.category.id;
        console.log('Parent Created:', parentId);

        // 2. Create Child
        console.log('Creating Child Category...');
        const childRes = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Child ' + Date.now(), parentId: parentId })
        });

        if (!childRes.ok) {
            const text = await childRes.text();
            throw new Error(`Child Create Failed: ${childRes.status} ${text}`);
        }

        const childData = await childRes.json();
        const childId = childData.category.id;
        console.log('Child Created:', childId);

        // 3. Verify Child has Parent
        console.log('Verifying Child-Parent Link...');
        const checkChildRes = await fetch(`${BASE_URL}/${childId}`);
        const checkChildData = await checkChildRes.json();
        if (checkChildData.category.parent?.id !== parentId) {
            throw new Error('Child does not have correct parent!');
        }
        console.log('Verification: Child correctly linked to Parent.');

        // 4. Test Cycle Detection (Try to make Parent a child of Child)
        console.log('Testing Cycle Detection...');
        const updateRes = await fetch(`${BASE_URL}/${parentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentId: childId })
        });
        const updateData = await updateRes.json();

        if (updateRes.status === 400 && updateData.error === 'Circular dependency detected') {
            console.log('SUCCESS: Cycle detection blocked the update.');
        } else {
            console.log('FAILURE: Cycle detection failed!', updateRes.status, updateData);
        }

        // Cleanup
        console.log('Cleaning up...');
        await fetch(`${BASE_URL}/${childId}`, { method: 'DELETE' });
        await fetch(`${BASE_URL}/${parentId}`, { method: 'DELETE' });
        console.log('Done.');

    } catch (error) {
        console.error('Verification Failed:', error);
    }
}

runVerification();
