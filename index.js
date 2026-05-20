const vehicleData = {
    'passengers-bus': {
        title: "Passengers Bus",
        driver: "John Doe",
        plate: "KAA 123X",
        lastService: "2025-12-10",
        description: "Standard long-distance passenger bus used for inter-city travel."
    }
};

function openModal(id) {
    const vehicle = vehicleData[id];
    const modal = document.getElementById('details-modal');
    const body = document.getElementById('modal-body');

    body.innerHTML = `
        <h2>${vehicle.title} Details</h2>
        <hr>
        <p><strong>Assigned Driver:</strong> ${vehicle.driver}</p>
        <p><strong>License Plate:</strong> ${vehicle.plate}</p>
        <p><strong>Last Maintenance:</strong> ${vehicle.lastService}</p>
        <p><strong>Notes:</strong> ${vehicle.description}</p>
    `;
    
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById('details-modal').style.display = "none";
}