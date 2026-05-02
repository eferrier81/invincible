package com.invinciblegame.scheduler;

import com.invinciblegame.repository.UserRepository;
import java.time.LocalDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EnergyRegenerationTask {
    private final UserRepository userRepository;

    public EnergyRegenerationTask(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void regenerateEnergyHourly() {
        userRepository.findAll().forEach(user -> {
            if (user.getEnergy() < 5) {
                user.setEnergy(user.getEnergy() + 1);
                user.setLastEnergyUpdate(LocalDateTime.now());
                userRepository.save(user);
            }
        });
    }
}
