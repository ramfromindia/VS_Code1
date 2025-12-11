const books = [
            " the Great Gatsby ",
            "1984",
            "To Kill a Mockingbird ",
            " pride and prejudice",
            "The Catcher in the Rye",
            "Animal Farm ",
            "Brave New World",
            " the Hobbit"
        ];

        // Select DOM elements
        const myBtn = document.getElementById("myBtn");
        const searchInput = document.querySelector("#searchInput");
        const bookList = document.querySelector("#bookList");

        // Process books array: map to objects with cleaned title and shortTitle
        const processedBooks = books.map(book => {
            const trimmedBook = book.trim();
            const capitalized = trimmedBook
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            const shortTitle = capitalized.length > 20 ? capitalized.slice(0, 20) + "..." : capitalized;
            return { title: capitalized, shortTitle };
        });

        // Sort processed books alphabetically by title
        const sortedBooks = processedBooks.slice().sort((a, b) => a.title.localeCompare(b.title));

        // Function to update book list based on search query
        function updateBookList(query) {
            const trimmedQuery = query.trim().toLowerCase();
            // Filter books where title (lowercased) includes query
            const filteredBooks = sortedBooks.filter(book => book.title.toLowerCase().includes(trimmedQuery));
            
            // Clear bookList
            bookList.innerHTML = "";
            
            // If no matches or empty query, show all books
            const booksToDisplay = trimmedQuery === "" ? sortedBooks : filteredBooks;
            
            // Append filtered or all books to bookList
            // Create a document fragment to minimize DOM reflows
            const fragment = document.createDocumentFragment();
            booksToDisplay.forEach(book => {
                const li = document.createElement("li");
                li.textContent = book.shortTitle;
                fragment.appendChild(li);
            });
            bookList.appendChild(fragment);
        }

        // Add input event listener for real-time search
        searchInput.addEventListener("input", () => {
            const query = searchInput.value;
            updateBookList(query);
        });

        // Add click event listener for button (optional, for manual trigger)
        myBtn.addEventListener("click", () => {
            const query = searchInput.value;
            updateBookList(query);
        });

        // Initial display of all books
        updateBookList("");