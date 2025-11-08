document.addEventListener('DOMContentLoaded', function() {
    let allPeople = []; // store current participants
    const form = document.getElementById('expense-form');
    const addBtn = document.getElementById('addParticipantBtn');
    const newInput = document.getElementById('newParticipant');
    const container = document.getElementById('participants-list');

    function updateParticipantsList() {
        if (allPeople.length === 0) {
            container.innerHTML = `
                <p class="text-muted-foreground text-sm col-span-2">
                    Add people above to select participants
                </p>
            `;
            return;
        }

        const participantsHTML = allPeople.map(person => `
            <div class="flex items-center space-x-2">
                <input type="checkbox" id="participant-${person}" name="participants" value="${person}" class="participant-checkbox" checked>
                <label for="participant-${person}" class="text-sm text-foreground cursor-pointer">
                    ${person}
                </label>
            </div>
        `).join('');

        container.innerHTML = participantsHTML;
    }

    function handleAddParticipant() {
        const name = newInput.value.trim();
        if (!name) return;

        if (!allPeople.includes(name)) {
            allPeople.push(name);
            newInput.value = '';
            updateParticipantsList();
        }
    }

    addBtn.addEventListener('click', handleAddParticipant);
    newInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddParticipant();
        }
    });

    // Optional: before submitting, ensure selected participants are checked
    form.addEventListener('submit', function() {
        const checkboxes = container.querySelectorAll('.participant-checkbox');
        checkboxes.forEach(cb => {
            if (allPeople.includes(cb.value)) cb.checked = true;
        });
    });

    // Initial render
    updateParticipantsList();
});
