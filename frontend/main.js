const studentsList = [];

// Обновление функции для первоначального отображения студентов
async function initializeStudents() {
    const students = await fetchStudents();
    studentsList.push(...students); // Добавляем студентов в глобальный массив
    renderStudentsTable(studentsList); // Отображаем студентов
}

const apiUrl = 'http://localhost:3000/api/students'; 

// Получение списка студентов с сервера
async function fetchStudents() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Ошибка при получении данных');
        }
        const students = await response.json();
        console.log('Полученные студенты:', students); // Логируем полученные данные
        return students;
    } catch (error) {
        console.error('Ошибка:', error);
        return [];
    }
}

// Сохранение нового студента на сервере
async function saveStudent(student) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(student),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка при сохранении студента: ${errorText}`);
        }
        const savedStudent = await response.json();
        console.log('Сохраненный студент:', savedStudent); // Логируем сохраненного студента
        return savedStudent; // Возвращаем добавленного студента с сервера
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function deleteStudent(studentId) {
    try {
        const response = await fetch(`${apiUrl}/${studentId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка при удалении студента: ${errorText}`);
        }
        return true; // Успешное удаление
    } catch (error) {
        console.error('Ошибка:', error);
        return false; // Не удалось удалить
    }
}

// Функция для вывода одного студента
function getStudentItem(studentObj, index) {
    const age = studentObj.birthday ? (new Date().getFullYear() - new Date(studentObj.birthday).getFullYear()) : 'неизвестно';
    const endYear = parseInt(studentObj.studyStart) + 4;
    const course = (new Date().getFullYear() > endYear) ? 'закончил' : Math.min(4, (new Date().getFullYear() - parseInt(studentObj.studyStart) + 1)) + ' курс';

    // Создаем элемент строки
    const row = document.createElement('tr');

    // Создаем ячейки и добавляем их в строку
    row.innerHTML = `
        <td>${studentObj.surname || 'Не указано'} ${studentObj.name || 'Не указано'} ${studentObj.lastname || 'Не указано'}</td>
        <td>${studentObj.faculty || 'Не указано'}</td>
        <td>${studentObj.birthday ? new Date(studentObj.birthday).toLocaleDateString('ru-RU') : 'Не указано'} (${age} лет)</td>
        <td>${studentObj.studyStart || 'Не указано'} - ${endYear} (${course})</td>
        <td><button onclick="removeStudent(${index})">Удалить</button></td>
    `;

    return row; // Возвращаем элемент строки
}

// Функция для отрисовки всех студентов
function renderStudentsTable(studentsArray) {
    const studentsBody = document.getElementById('studentsBody');
    studentsBody.innerHTML = ''; // Очищаем текущее содержимое

    const fragment = document.createDocumentFragment();

    studentsArray.forEach((student, index) => {
        const studentRow = getStudentItem(student, index); // Получаем элемент строки для студента
        fragment.appendChild(studentRow); // Добавляем строку в фрагмент
    });

    studentsBody.appendChild(fragment); // Вставляем фрагмент в DOM
}

// Добавление студента с событием отправки формы
document.getElementById('studentForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const middleName = document.getElementById('middleName').value.trim();
    const birthDate = new Date(document.getElementById('birthDate').value);
    const startYear = parseInt(document.getElementById('startYear').value, 10);
    const faculty = document.getElementById('faculty').value.trim();

    // Очистка ошибок
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach((errorMessage) => {
        errorMessage.textContent = '';
    });

    // Валидация
    const currentDate = new Date();
    let hasErrors = false;
    if (!firstName) {
        document.getElementById('firstNameError').textContent = 'Пожалуйста, заполните поле "Имя".';
        hasErrors = true;
    }
    if (!lastName) {
        document.getElementById('lastNameError').textContent = 'Пожалуйста, заполните поле "Фамилия".';
        hasErrors = true;
    }
    if (!middleName) {
        document.getElementById('middleNameError').textContent = 'Пожалуйста, заполните поле "Отчество".';
        hasErrors = true;
    }
    if (!faculty) {
        document.getElementById('facultyError').textContent = 'Пожалуйста, заполните поле "Факультет".';
        hasErrors = true;
    }
    const birthDateInput = document.getElementById('birthDate').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateInput)) {
        document.getElementById('birthDateError').textContent = 'Пожалуйста, введите дату рождения в формате ГГГГ-ММ-ДД.';
        hasErrors = true;
    } else {
        const birthDate = new Date(birthDateInput);
        if (birthDate < new Date(1900, 0, 1) || birthDate > currentDate) {
            document.getElementById('birthDateError').textContent = 'Пожалуйста, введите дату рождения в диапазоне с 01.01.1900 по текущую дату.';
            hasErrors = true;
        }
    }
    if (isNaN(startYear) || startYear < 2000 || startYear > currentDate.getFullYear()) {
        document.getElementById('startYearError').textContent = 'Пожалуйста, введите год начала обучения в диапазоне с 2000 по текущий год.';
        hasErrors = true;
    }
    if (!hasErrors) {
        const newStudent = {
            name: firstName,
            surname: lastName,
            lastname: middleName,
            birthday: birthDate.toISOString(),
            studyStart: startYear,
            faculty
        };
    
        // Сохраняем студента на сервере
        const savedStudent = await saveStudent(newStudent);
        if (savedStudent) {
            // Если студент успешно сохранен, добавляем его в локальный список
            studentsList.push(savedStudent); // Убеждаемся что savedStudent содержит id
            renderStudentsTable(studentsList); // Обновляем таблицу
            event.target.reset(); // Сброс формы
        }
    }
});

async function removeStudent(index) {
    if (index < 0 || index >= studentsList.length) {
        console.error('Ошибка: индекс вне диапазона', index);
        return; // Выход из функции, если индекс недействителен
    }

    const studentId = studentsList[index].id; // Получаем ID студента
    console.log('ID студента для удаления:', studentId); // Логируем ID студента
    if (!studentId) {
        console.error('Ошибка: ID студента не найден');
        return; // Выход из функции, если ID недействителен
    }

    console.log('Удаляем студента с ID:', studentId);
    
    const success = await deleteStudent(studentId); // Удаляем студента с сервера
    if (success) {
        studentsList.splice(index, 1); // Удаляем студента из локального списка
        renderStudentsTable(studentsList); // Обновляем отображение
    } else {
        console.error('Не удалось удалить студента');
    }
}

// Вызов функции для первоначального отображения студентов
initializeStudents(); // Загрузка студентов с сервера

// Сортировка массива студентов
let sortDirection = true;

function sortTable(columnIndex) {
    console.log('Нажата кнопка сортировки');
    console.log('Индекс столбца:', columnIndex);
    // Определяем тип данных столбца
    let isFullName = columnIndex === 0;
    let isFaculty = columnIndex === 1;
    let isDate = columnIndex === 2;
    let isStudyYears = columnIndex === 3;

    studentsList.sort((a, b) => {
        if (isFullName) {
            const aFullName = `${a.lastName} ${a.firstName} ${a.middleName}`;
            const bFullName = `${b.lastName} ${b.firstName} ${b.middleName}`;
            return sortDirection ? aFullName.localeCompare(bFullName) : bFullName.localeCompare(aFullName);
        } else if (isFaculty) {
            return sortDirection ? a.faculty.localeCompare(b.faculty) : b.faculty.localeCompare(a.faculty);
        } else if (isDate) {
            return sortDirection ? a.birthDate - b.birthDate : b.birthDate - a.birthDate;
        } else if (isStudyYears) {
            return sortDirection ? a.startYear - b.startYear : b.startYear - a.startYear;
        }
    });

    sortDirection = !sortDirection;
    renderStudentsTable(studentsList);
}

// Слушиватели событий в заголовки таблиц
function addEventListenersToTableHeaders() {
    console.log('Добавляем слушатели событий к ячейкам заголовочной строки');
    const tableHeaders = document.querySelectorAll('#myTable thead th');
    tableHeaders.forEach((header, columnIndex) => {
      console.log('Добавляем слушатель события к ячейке заголовочной строки', columnIndex);
      header.addEventListener('click', (event) => {
        console.log('Нажата кнопка сортировки');
        event.preventDefault();
        sortTable(columnIndex);
      });
    });
}

// Вызов функции для первоначального отображения студентов
renderStudentsTable(studentsList);
addEventListenersToTableHeaders();

// Фильтрация массива студентов
function filterStudents(fullName, faculty, studyStart, endYear) {
    // Если все поля пустые, возвращаем полный список студентов
    if (!fullName && !faculty && !studyStart && !endYear) {
        console.log('Все поля пустые, возвращаем полный список студентов.');
        renderStudentsTable(studentsList);
        return;
    }

    const fullNameParts = fullName.split(' '); // Разбиваем полное имя на части

    console.log('Фильтруем студентов с параметрами:', {
        fullName,
        faculty,
        studyStart,
        endYear
    });

    const filteredStudents = studentsList.filter((student) => {
        let isValid = true;

        // Фильтрация по полному имени
        if (fullName) {
            const studentFullName = `${student.surname} ${student.name} ${student.lastname}`.toLowerCase();
            isValid = fullNameParts.every(part => studentFullName.includes(part));
            console.log(`Фильтрация по имени: ${studentFullName} - ${isValid}`);
        }

        // Фильтрация по факультету
        if (faculty) {
            const facultyMatch = student.faculty.toLowerCase().includes(faculty);
            isValid = isValid && facultyMatch;
            console.log(`Факультет: ${student.faculty}, Фильтр: ${faculty}, Результат: ${facultyMatch}`);
        }

        // Фильтрация по году начала обучения
        if (studyStart) {
            const studentStartYear = parseInt(student.studyStart, 10);
            const filterStartYear = parseInt(studyStart, 10);
            const startYearMatch = studentStartYear >= filterStartYear;
            isValid = isValid && startYearMatch;
            console.log(`Год начала: ${studentStartYear}, Фильтр: ${filterStartYear}, Результат: ${startYearMatch}`);
        }

        // Фильтрация по году конца обучения
        if (endYear) {
            const studentEndYear = parseInt(student.studyStart, 10) + 4; // Предполагаем, что обучение длится 4 года
            const filterEndYear = parseInt(endYear, 10);
            const endYearMatch = studentEndYear <= filterEndYear;
            isValid = isValid && endYearMatch;
            console.log(`Год окончания: ${studentEndYear}, Фильтр: ${filterEndYear}, Результат: ${endYearMatch}`);
        }

        return isValid;
    });

    console.log('Отфильтрованные студенты:', filteredStudents); // Логируем отфильтрованные данные
    renderStudentsTable(filteredStudents);
}


document.addEventListener('DOMContentLoaded', () => {
    const filterButton = document.getElementById('filterButton');
filterButton.addEventListener('click', () => {
    console.log('Кнопка фильтрации нажата'); // Логируем нажатие кнопки
    // Логирование элементов перед получением их значений
    console.log('Элемент полного имени:', document.getElementById('fullName'));
    console.log('Элемент факультета:', document.getElementById('faculty'));
    console.log('Элемент года начала:', document.getElementById('startYear'));
    console.log('Элемент года окончания:', document.getElementById('endYear'));

    const fullName = document.getElementById('filterFullName').value.toLowerCase().trim();
    const faculty = document.getElementById('filterFaculty').value.toLowerCase().trim();
    const startYear = document.getElementById('filterStartYear').value.trim();
    const endYear = document.getElementById('filterEndYear').value.trim();

    // Логирование значений перед фильтрацией
    console.log('Полное имя:', fullName);
    console.log('Факультет:', faculty);
    console.log('Год начала:', startYear);
    console.log('Год окончания:', endYear);

    console.log('Фильтрация с параметрами:', {
        fullName,
        faculty,
        startYear,
        endYear
    });

    // Проверка на пустые поля
    if (!fullName && !faculty && !startYear && !endYear) {
        console.log('Все поля пустые, возвращаем полный список студентов.');
        renderStudentsTable(studentsList);
        return; // Выход из функции, если все поля пустые
    }

    // Вызов функции фильтрации
    filterStudents(fullName, faculty, startYear, endYear);
});
});


// Обработка нажатия кнопки для сброса фильтров
const resetFilterButton = document.getElementById('resetFilterButton');
resetFilterButton.addEventListener('click', () => {
    const filterFields = document.querySelectorAll('#filterFields input');
    filterFields.forEach((input) => {
        input.value = ''; // Сбрасываем значения полей
    });
    renderStudentsTable(studentsList); // Возвращаемся к полному списку студентов
});