document.addEventListener('DOMContentLoaded', function() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const staffCards = document.querySelectorAll('.staff-card');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'))
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-filter');
                
                staffCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-department') === filterValue) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    });