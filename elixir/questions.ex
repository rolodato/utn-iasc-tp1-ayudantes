# {id, question, asker, answered?, pending_response?}

defmodule Questions do
  def start() do
    spawn fn -> loop([], [], 0) end
  end

  def loop(questions, teachers, id) do
    receive do
      {:ask, question, sender} ->
        IO.puts "#{inspect sender} pregunto #{question} (#{id})"
        senders = Enum.filter(questions, fn {_, _, s, _, _} -> s != sender end)
        Enum.each(senders, fn {_, _, s, _, _} -> send s, {:new_question, question} end)
        Enum.each(teachers, fn t -> send t, {:new_question, question} end)
        loop([{id, question, sender, false, false} | questions], teachers, id + 1)

      {:register, sender} ->
        if Enum.member?(teachers, sender) do
          send sender, {:error, "#{inspect sender} ya esta registrado como docente"}
          loop(questions, teachers, id)
        else
          loop(questions, [sender | teachers], id)
        end

      {:answer, id, answer, sender} ->
        question = Enum.find(questions, nil, fn {question_id, _, _, _, _} -> id == question_id end)
        cond do
          !question ->
            send sender, {:error, "La pregunta #{id} no existe"}
            loop(questions, teachers, id)
          !Enum.member?(teachers, sender) ->
            send sender, {:error, "Debe registrarse antes de contestar"}
            loop(questions, teachers, id)
          elem(question, 3) ->
            send sender, {:error, "La pregunta #{id} ya fue contestada"}
            loop(questions, teachers, id)
          true ->
            students = Enum.map(questions, fn {_, _, s, _, _} -> s end)
            all = Enum.concat(students, teachers)
            Enum.each(all, fn p -> send p, {:new_answer, id, answer} end)
            other_questions = Enum.filter(questions, fn q -> q != question end)
            answered_question = put_elem(question, 3, true)
            loop([answered_question | other_questions], teachers, id)
        end

      {:start_answer, id, sender} ->
        question = Enum.find(questions, nil, fn {question_id, _, _, _, _} -> id == question_id end)
        cond do
          !question ->
            send sender, {:error, "La pregunta #{id} no existe"}
            loop(questions, teachers, id)
          !Enum.member?(teachers, sender) ->
            send sender, {:error, "Debe registrarse antes de contestar"}
            loop(questions, teachers, id)
          elem(question, 3) ->
            send sender, {:error, "La pregunta #{id} ya fue contestada"}
            loop(questions, teachers, id)
          true ->
            other_questions = Enum.filter(questions, fn q -> q != question end)
            pending_question = put_elem(question, 4, true)
            Enum.each(teachers, fn t -> send t, {:answer_started, id} end)
            loop([pending_question | other_questions], teachers, id)
        end

    end
  end
end

defmodule Student do
  def start() do
    spawn fn -> loop() end
  end

  def loop() do
    receive do
      {:new_question, question} ->
        IO.puts "Alumno #{inspect self} recibio pregunta: #{question}"
        loop()

      {:new_answer, id, answer} ->
        IO.puts "Alumno #{inspect self} recibio respuesta a #{id}: #{answer}"
        loop()
    end
  end

end

defmodule Teacher do
  def start() do
    spawn fn -> loop([]) end
  end

  def loop(questions) do
    receive do
      {:new_question, question} ->
        IO.puts "Docente #{self} recibio nueva pregunta: #{question}"
        loop([question | questions])

      {:new_answer, id, answer} ->
        IO.puts "Docente #{inspect self} recibio respuesta a #{id}: #{answer}"
        loop(Enum.filter(questions, fn {questionId, _, _, _, _} -> questionId != id end))

      {:error, msg} ->
        IO.puts "Docente #{inspect self} recibio error: #{msg}"
        loop(questions)

      {:answer_started, id} ->
        IO.puts "Docente #{inspect self} recibio: alguien esta contestando la pregunta #{id}"
        loop(questions)
    end
  end

end


s1 = Student.start
s2 = Student.start
t = Teacher.start
q = Questions.start

send q, {:ask, "hola", s1}
send q, {:ask, "chau", s2}
send q, {:register, t}
send q, {:register, t}
send q, {:start_answer, 1, t}
send q, {:start_answer, 1, t}
send q, {:answer, 1, "respuesta a 1", t}
send q, {:answer, 1, "respuesta a 1", t}
